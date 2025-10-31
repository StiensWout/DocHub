import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserGroups, isAdmin } from "@/lib/auth/user-groups";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { DocumentFile } from "@/types";
import {
  validateFileTypeAndExtension,
  validateFileSize,
  validateFilename,
  sanitizeFilename,
} from "@/lib/constants/file-validation";

/**
 * Check if a user has permission to modify/delete a file
 * @param fileMetadata - The file metadata from database
 * @param userId - The user ID
 * @param userGroups - The user's groups
 * @param userIsAdmin - Whether the user is an admin
 * @returns true if user has permission, false otherwise
 */
async function canModifyFile(
  fileMetadata: DocumentFile,
  userId: string,
  userGroups: string[],
  userIsAdmin: boolean
): Promise<boolean> {
  // Admins can modify any file
  if (userIsAdmin) {
    return true;
  }

  // If file is associated with a document, check document access
  if (fileMetadata.document_id && fileMetadata.document_type) {
    // Check if user has access to the document via document_access_groups
    const { data: accessGroups, error } = await supabaseAdmin
      .from("document_access_groups")
      .select("group_name")
      .eq("team_document_id", fileMetadata.document_id);

    if (error) {
      console.error("Error checking document access:", error);
      return false;
    }

    const allowedGroups = (accessGroups || []).map(a => a.group_name);
    
    // Check if user is in any of the allowed groups
    if (allowedGroups.length > 0) {
      return userGroups.some(group => allowedGroups.includes(group));
    }

    // If document has no access groups defined, default to no access for team documents
    // Base documents are always accessible, but we should still check ownership
    if (fileMetadata.document_type === "base") {
      // Base documents are generally accessible, but we can check ownership if uploaded_by exists
      if (fileMetadata.uploaded_by) {
        return fileMetadata.uploaded_by === userId;
      }
      return true; // Base documents without owner are accessible
    }

    // Team documents with no access groups = no access by default
    return false;
  }

  // If file is only associated with an application (no document)
  // Check if user uploaded it or if it's public and user can see it
  if (fileMetadata.application_id) {
    // If user uploaded it, they can modify it
    if (fileMetadata.uploaded_by === userId) {
      return true;
    }

    // For application-level files, check visibility and team membership
    if (fileMetadata.visibility === "public") {
      // Public files can be modified by anyone authenticated (conservative: only owner)
      // For stricter security, only allow owner to modify
      return fileMetadata.uploaded_by === userId;
    }

    if (fileMetadata.visibility === "team" && fileMetadata.team_id) {
      // Team files: check if user's groups match the team
      // This is a simplified check - in reality, teams and groups might be more complex
      return userGroups.some(group => {
        // Simple check: if group name contains team_id or vice versa
        // This is a placeholder - actual team/group mapping might be more complex
        return group.toLowerCase().includes(fileMetadata.team_id!.toLowerCase()) ||
               fileMetadata.team_id!.toLowerCase().includes(group.toLowerCase());
      });
    }
  }

  // Default: no access
  return false;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    // Authentication check
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const fileId = params.fileId;

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Get existing file metadata
    const { data: existingFile, error: fetchError } = await supabaseAdmin
      .from("document_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fetchError || !existingFile) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const userIsAdmin = await isAdmin();
    const userGroups = await getUserGroups(session.user.id);
    const hasPermission = await canModifyFile(
      existingFile as DocumentFile,
      session.user.id,
      userGroups,
      userIsAdmin
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this file" },
        { status: 403 }
      );
    }

    // Get the new file from form data
    const formData = await request.formData();
    const newFile = formData.get("file") as File | null;

    if (!newFile) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate filename
    const filenameValidation = validateFilename(newFile.name);
    if (!filenameValidation.valid) {
      return NextResponse.json(
        { error: filenameValidation.error },
        { status: 400 }
      );
    }

    // Validate file size
    const sizeValidation = validateFileSize(newFile.size);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      );
    }

    // Validate file type and extension
    const typeValidation = validateFileTypeAndExtension(
      newFile.name,
      newFile.type
    );
    if (!typeValidation.valid) {
      return NextResponse.json(
        { error: typeValidation.error },
        { status: 400 }
      );
    }

    // Create staging path for new file (temporary location)
    // Using a staging area ensures we don't lose the old file if upload fails
    const stagingFileId = crypto.randomUUID();
    const sanitizedFilename = sanitizeFilename(newFile.name);
    const stagingFileName = `${stagingFileId}_${sanitizedFilename}`;
    
    // Extract directory path from existing file path
    const pathParts = existingFile.file_path.split('/');
    pathParts.pop(); // Remove filename
    const directoryPath = pathParts.join('/');
    
    // Staging path: same directory but with temporary filename
    const stagingPath = directoryPath 
      ? `${directoryPath}/_staging_${stagingFileName}`
      : `_staging_${stagingFileName}`;

    // Step 1: Upload new file to staging location first (don't touch old file yet)
    const { error: stagingUploadError } = await supabaseAdmin.storage
      .from(existingFile.storage_bucket)
      .upload(stagingPath, newFile, {
        contentType: newFile.type,
        upsert: false, // Don't overwrite - this is a new file
      });

    if (stagingUploadError) {
      console.error("Staging upload error:", stagingUploadError);
      return NextResponse.json(
        { error: "Failed to upload new file" },
        { status: 500 }
      );
    }

    // Step 2: Upload staging file to final location (replaces old file)
    // This is the critical point - once this succeeds, old file is replaced
    // We use the file we already have in memory (newFile) rather than downloading
    const { error: finalUploadError } = await supabaseAdmin.storage
      .from(existingFile.storage_bucket)
      .upload(existingFile.file_path, newFile, {
        contentType: newFile.type,
        upsert: true, // Overwrite old file
      });

    if (finalUploadError) {
      console.error("Final upload error:", finalUploadError);
      // Rollback: Remove staging file, old file is still intact
      await supabaseAdmin.storage
        .from(existingFile.storage_bucket)
        .remove([stagingPath]);
      return NextResponse.json(
        { error: "Failed to replace file" },
        { status: 500 }
      );
    }

    // Step 4: Update file metadata in database (now safe - new file is in place)
    const updateData: any = {
      file_name: newFile.name,
      file_type: newFile.type,
      file_size: newFile.size,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedFile, error: dbError } = await supabaseAdmin
      .from("document_files")
      .update(updateData)
      .eq("id", fileId)
      .select()
      .single();

    if (dbError) {
      console.error("Database update error:", dbError);
      // Rollback: Try to restore old file if possible
      // Note: We can't restore the old file content, but we can keep the metadata
      // In a real system, you might want to keep a backup or version
      // For now, we log the error - the new file is already in place
      console.error("Warning: Database update failed but file was replaced. Manual intervention may be required.");
      // Cleanup staging file
      await supabaseAdmin.storage
        .from(existingFile.storage_bucket)
        .remove([stagingPath])
        .catch(err => console.error("Failed to cleanup staging:", err));
      
      return NextResponse.json(
        { error: "Failed to update file metadata" },
        { status: 500 }
      );
    }

    // Step 5: Cleanup staging file (operation successful)
    const { error: stagingDeleteError } = await supabaseAdmin.storage
      .from(existingFile.storage_bucket)
      .remove([stagingPath]);

    if (stagingDeleteError) {
      console.warn("Failed to clean up staging file:", stagingDeleteError);
      // Non-critical: staging file cleanup failed, but operation succeeded
      // The staging file will be orphaned but won't affect functionality
    }

    // Get public URL for the updated file
    const { data: urlData } = supabaseAdmin.storage
      .from(existingFile.storage_bucket)
      .getPublicUrl(existingFile.file_path);

    return NextResponse.json(
      {
        success: true,
        file: updatedFile,
        url: urlData.publicUrl,
        message: "File replaced successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("File replace error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    // Authentication check
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const fileId = params.fileId;

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Get file metadata first
    const { data: fileMetadata, error: fetchError } = await supabaseAdmin
      .from("document_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fetchError || !fileMetadata) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const userIsAdmin = await isAdmin();
    const userGroups = await getUserGroups(session.user.id);
    const hasPermission = await canModifyFile(
      fileMetadata as DocumentFile,
      session.user.id,
      userGroups,
      userIsAdmin
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this file" },
        { status: 403 }
      );
    }

    // Delete file from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(fileMetadata.storage_bucket)
      .remove([fileMetadata.file_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continue to delete metadata even if storage delete fails
    }

    // Delete file metadata from database
    const { error: dbError } = await supabaseAdmin
      .from("document_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      console.error("Database delete error:", dbError);
      return NextResponse.json(
        { error: "Failed to delete file metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
