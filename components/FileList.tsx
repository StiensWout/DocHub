"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Trash2, Loader2, Globe, Users, RefreshCw, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { getAllFilesForDocument, deleteFileMetadata } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import type { DocumentFile, DocumentType } from "@/types";
import FileViewer from "./FileViewer";

interface FileListProps {
  documentId: string;
  documentType: DocumentType;
  applicationId?: string;
  teamId?: string;
  onFileDeleted?: () => void;
  className?: string;
}

export default function FileList({
  documentId,
  documentType,
  applicationId,
  teamId,
  onFileDeleted,
  className = "",
}: FileListProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<DocumentFile | null>(null);
  const [showApplicationFiles, setShowApplicationFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [documentId, documentType, applicationId, teamId]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      if (applicationId) {
        // Get both document files and application files
        const fileList = await getAllFilesForDocument(
          documentId,
          documentType,
          applicationId,
          teamId
        );
        setFiles(fileList);
      } else {
        // Fallback to document files only
        const { getDocumentFiles } = await import("@/lib/supabase/queries");
        const fileList = await getDocumentFiles(documentId, documentType);
        setFiles(fileList);
      }
    } catch (err) {
      console.error("Error loading files:", err);
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    setDeletingId(fileId);
    try {
      // Delete via API endpoint (handles both storage and database)
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }

      // Remove from local state
      setFiles(files.filter((f) => f.id !== fileId));
      
      if (onFileDeleted) {
        onFileDeleted();
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      alert(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReplace = async (fileId: string, newFile: File) => {
    setReplacingId(fileId);
    try {
      const formData = new FormData();
      formData.append("file", newFile);

      const response = await fetch(`/api/files/${fileId}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Replace failed");
      }

      // Reload files to get updated metadata
      await loadFiles();
      
      if (onFileDeleted) {
        onFileDeleted();
      }
    } catch (err) {
      console.error("Error replacing file:", err);
      alert(err instanceof Error ? err.message : "Failed to replace file");
    } finally {
      setReplacingId(null);
    }
  };

  const handleDownload = async (file: DocumentFile) => {
    try {
      // Get public URL from Supabase Storage
      const { data } = supabase.storage
        .from(file.storage_bucket)
        .getPublicUrl(file.file_path);

      if (data?.publicUrl) {
        // Open in new tab for download
        window.open(data.publicUrl, "_blank");
      } else {
        throw new Error("Could not get file URL");
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download file");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "📊";
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📽️";
    if (fileType.includes("zip") || fileType.includes("archive")) return "📦";
    return "📎";
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-400 ${className}`}>
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        No files attached
      </div>
    );
  }

  // Separate files by type
  const documentFiles = files.filter(f => f.document_id !== null);
  const applicationFiles = files.filter(f => f.document_id === null);

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-300 mb-3">
        Files ({files.length})
      </h3>
      
      {/* Document Files */}
      {documentFiles.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-400 mb-2">Document Files</h4>
          {documentFiles.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              deletingId={deletingId}
              replacingId={replacingId}
              onDelete={handleDelete}
              onReplace={handleReplace}
              onDownload={handleDownload}
              onView={() => setViewingFile(file)}
              getFileIcon={getFileIcon}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      )}

      {/* Application Files - Collapsible */}
      {applicationFiles.length > 0 && (
        <div>
          <button
            onClick={() => setShowApplicationFiles(!showApplicationFiles)}
            className="
              flex items-center gap-2 w-full text-xs text-gray-400 mb-2
              hover:text-gray-300 transition-colors
            "
          >
            {showApplicationFiles ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>Application Files ({applicationFiles.length})</span>
          </button>
          
          {showApplicationFiles && (
            <div className="space-y-2">
              {applicationFiles.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  deletingId={deletingId}
                  replacingId={replacingId}
                  onDelete={handleDelete}
                  onReplace={handleReplace}
                  onDownload={handleDownload}
                  onView={() => setViewingFile(file)}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* File Viewer Modal */}
      <FileViewer
        file={viewingFile}
        isOpen={viewingFile !== null}
        onClose={() => setViewingFile(null)}
      />
    </div>
  );
}

function FileItem({
  file,
  deletingId,
  replacingId,
  onDelete,
  onReplace,
  onDownload,
  onView,
  getFileIcon,
  formatFileSize,
}: {
  file: DocumentFile;
  deletingId: string | null;
  replacingId: string | null;
  onDelete: (id: string) => void;
  onReplace: (id: string, file: File) => void;
  onDownload: (file: DocumentFile) => void;
  onView: () => void;
  getFileIcon: (type: string) => string;
  formatFileSize: (bytes: number) => string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isReplacing = replacingId === file.id;
  const isDeleting = deletingId === file.id;

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onReplace(file.id, selectedFile);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="
        flex items-center justify-between p-3 rounded-lg
        bg-gray-800/50 border border-gray-700/50
        hover:bg-gray-800/70 transition-colors
      "
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl">{getFileIcon(file.file_type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="text-sm font-medium text-gray-200 truncate hover:text-purple-400 transition-colors text-left"
            >
              {file.file_name}
            </button>
            {file.visibility && (
              <span className={`
                flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
                ${file.visibility === 'public' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }
              `}>
                {file.visibility === 'public' ? (
                  <>
                    <Globe className="w-3 h-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3" />
                    Team
                  </>
                )}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {formatFileSize(file.file_size)} • {file.file_type.split("/")[1]?.toUpperCase() || "FILE"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.svg"
          disabled={isReplacing || isDeleting}
        />

        <button
          onClick={onView}
          className="
            p-2 rounded hover:bg-gray-700/50 transition-colors
            text-gray-400 hover:text-purple-400
          "
          title="View file"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          onClick={handleReplaceClick}
          disabled={isReplacing || isDeleting}
          className="
            p-2 rounded hover:bg-gray-700/50 transition-colors
            text-gray-400 hover:text-green-400
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          title="Replace file"
        >
          {isReplacing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => onDownload(file)}
          className="
            p-2 rounded hover:bg-gray-700/50 transition-colors
            text-gray-400 hover:text-blue-400
          "
          title="Download file"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(file.id)}
          disabled={isDeleting || isReplacing}
          className="
            p-2 rounded hover:bg-gray-700/50 transition-colors
            text-gray-400 hover:text-red-400
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          title="Delete file"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
