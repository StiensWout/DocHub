import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

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
