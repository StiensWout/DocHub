import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
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
