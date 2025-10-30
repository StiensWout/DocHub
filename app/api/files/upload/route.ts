import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

// Allowed file types
const ALLOWED_FILE_TYPES = [
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/msword", // DOC
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
  "application/vnd.ms-excel", // XLS
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
  "application/vnd.ms-powerpoint", // PPT
  "text/plain", // TXT
  "text/markdown", // MD
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentId = formData.get("documentId") as string | null;
    const documentType = formData.get("documentType") as string | null;
    const applicationId = formData.get("applicationId") as string | null;
    const teamId = formData.get("teamId") as string | null;
    const visibility = (formData.get("visibility") as string) || "team";

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Must have either documentId or applicationId
    if (!documentId && !applicationId) {
      return NextResponse.json(
        { error: "Either document ID or application ID is required" },
        { status: 400 }
      );
    }

    // If documentId is provided, documentType must be provided
    if (documentId && !documentType) {
      return NextResponse.json(
        { error: "Document type is required when document ID is provided" },
        { status: 400 }
      );
    }

    if (documentType && !["base", "team"].includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    if (!["public", "team"].includes(visibility)) {
      return NextResponse.json(
        { error: "Invalid visibility. Must be 'public' or 'team'" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileId = crypto.randomUUID();
    const fileName = `${fileId}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    
    // Build storage path based on upload type
    let storagePath: string;
    let finalTeamId: string | null = null;

    if (documentId) {
      // Document-level file
      if (teamId && applicationId) {
        storagePath = `documents/${teamId}/${applicationId}/${documentId}/${fileName}`;
        finalTeamId = teamId;
      } else {
        storagePath = `documents/${documentId}/${fileName}`;
      }
    } else if (applicationId) {
      // Application-level file
      if (visibility === "team" && teamId) {
        storagePath = `documents/${teamId}/${applicationId}/${fileName}`;
        finalTeamId = teamId;
      } else {
        // Public application file
        storagePath = `documents/${applicationId}/${fileName}`;
        finalTeamId = null;
      }
    } else {
      return NextResponse.json(
        { error: "Invalid configuration" },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Get public URL for the file
    const { data: urlData } = supabaseAdmin.storage
      .from("documents")
      .getPublicUrl(storagePath);

    // Insert file metadata into database
    const fileMetadata: any = {
      file_name: file.name,
      file_path: storagePath,
      file_type: file.type,
      file_size: file.size,
      storage_bucket: "documents",
      visibility: visibility,
    };

    if (documentId) {
      fileMetadata.document_id = documentId;
      fileMetadata.document_type = documentType;
    }

    if (applicationId) {
      fileMetadata.application_id = applicationId;
    }

    if (finalTeamId) {
      fileMetadata.team_id = finalTeamId;
    }

    const { data: insertedFile, error: dbError } = await supabaseAdmin
      .from("document_files")
      .insert(fileMetadata)
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from("documents").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to save file metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        file: insertedFile,
        url: urlData.publicUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
