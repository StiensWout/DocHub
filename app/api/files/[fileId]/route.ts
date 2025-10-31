import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserGroups, isAdmin } from "@/lib/auth/user-groups";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { DocumentFile } from "@/types";

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

// Allowed file types (same as upload route)
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/msword", // DOC
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
  "application/vnd.ms-excel", // XLS
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
  "application/vnd.ms-powerpoint", // PPT
  "text/plain", // TXT
  "text/markdown", // MD
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

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

    // Validate file size
    if (newFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(newFile.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Delete old file from storage
    const { error: storageDeleteError } = await supabaseAdmin.storage
      .from(existingFile.storage_bucket)
      .remove([existingFile.file_path]);

    if (storageDeleteError) {
      console.error("Storage delete error:", storageDeleteError);
      // Continue anyway - we'll upload the new file
    }

    // Upload new file to the same path (replacing it)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(existingFile.storage_bucket)
      .upload(existingFile.file_path, newFile, {
        contentType: newFile.type,
        upsert: true, // Overwrite existing file
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload new file" },
        { status: 500 }
      );
    }

    // Update file metadata in database
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
      // Try to clean up uploaded file
      await supabaseAdmin.storage
        .from(existingFile.storage_bucket)
        .remove([existingFile.file_path]);
      return NextResponse.json(
        { error: "Failed to update file metadata" },
        { status: 500 }
      );
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
