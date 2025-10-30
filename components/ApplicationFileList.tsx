"use client";

import { useState, useEffect } from "react";
import { Download, Trash2, Loader2, Globe, Users } from "lucide-react";
import { getApplicationFiles } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import type { DocumentFile } from "@/types";

interface ApplicationFileListProps {
  applicationId: string;
  teamId?: string;
  onFileDeleted?: () => void;
  className?: string;
}

export default function ApplicationFileList({
  applicationId,
  teamId,
  onFileDeleted,
  className = "",
}: ApplicationFileListProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [applicationId, teamId]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const fileList = await getApplicationFiles(applicationId, teamId);
      setFiles(fileList);
    } catch (err) {
      console.error("Error loading application files:", err);
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
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }

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

  const handleDownload = async (file: DocumentFile) => {
    try {
      const { data } = supabase.storage
        .from(file.storage_bucket)
        .getPublicUrl(file.file_path);

      if (data?.publicUrl) {
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
    return null; // Don't show anything if no files
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-300 mb-3">
        Application Files ({files.length})
      </h4>
      
      {files.map((file) => (
        <div
          key={file.id}
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
                <div className="text-sm font-medium text-gray-200 truncate">
                  {file.file_name}
                </div>
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
            <button
              onClick={() => handleDownload(file)}
              className="
                p-2 rounded hover:bg-gray-700/50 transition-colors
                text-gray-400 hover:text-blue-400
              "
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleDelete(file.id)}
              disabled={deletingId === file.id}
              className="
                p-2 rounded hover:bg-gray-700/50 transition-colors
                text-gray-400 hover:text-red-400
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              title="Delete file"
            >
              {deletingId === file.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

