"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Globe, Users } from "lucide-react";
import type { DocumentType, FileUploadParams } from "@/types";

interface FileUploadButtonProps {
  documentId?: string;
  documentType?: DocumentType;
  applicationId?: string;
  teamId?: string;
  onUploadSuccess?: () => void;
  className?: string;
  variant?: "button" | "dropzone"; // button = small button, dropzone = large drag area
}

export default function FileUploadButton({
  documentId,
  documentType,
  applicationId,
  teamId,
  onUploadSuccess,
  className = "",
  variant = "button",
}: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'team'>('team');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  // Validate that we have either documentId or applicationId
  const isValidConfig = documentId || applicationId;

  const uploadFile = useCallback(async (file: File) => {
    if (!isValidConfig) {
      setError("Missing document or application ID");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return;
    }

    // Reset error
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("visibility", visibility);
      
      if (documentId) {
        formData.append("documentId", documentId);
        formData.append("documentType", documentType!);
      }
      
      if (applicationId) {
        formData.append("applicationId", applicationId);
      }
      
      if (teamId) {
        formData.append("teamId", teamId);
      }

      // Upload file
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      setUploadProgress(100);
      
      // Reset progress after a moment
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setIsDragging(false);
      }, 1000);
    } catch (err) {
      console.error("File upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      setUploadProgress(0);
      setIsDragging(false);
    }
  }, [documentId, documentType, applicationId, teamId, visibility, onUploadSuccess, MAX_FILE_SIZE, isValidConfig]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  }, [isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  }, [isUploading, uploadFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (variant === "dropzone") {
    return (
      <div className={className}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center
            transition-all cursor-pointer
            ${
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
            }
            ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.svg"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className="text-gray-300">Uploading...</span>
              {uploadProgress > 0 && (
                <span className="text-sm text-gray-400">{uploadProgress}%</span>
              )}
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-300 mb-2">
                Drag and drop a file here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, DOCX, XLSX, images, and more (max 50MB)
              </p>
            </>
          )}

          {/* Visibility Selector */}
          {applicationId && !isUploading && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <span className="text-sm text-gray-400">Visibility:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVisibility('public');
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-1 rounded text-sm
                    transition-colors
                    ${
                      visibility === 'public'
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-gray-700/50 text-gray-400 border border-gray-600 hover:bg-gray-700"
                    }
                  `}
                >
                  <Globe className="w-4 h-4" />
                  Public
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVisibility('team');
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-1 rounded text-sm
                    transition-colors
                    ${
                      visibility === 'team'
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-gray-700/50 text-gray-400 border border-gray-600 hover:bg-gray-700"
                    }
                  `}
                >
                  <Users className="w-4 h-4" />
                  Team Only
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-400 text-center">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Button variant (default)
  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.svg"
        disabled={isUploading}
      />
      
      <button
        onClick={handleClick}
        disabled={isUploading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          bg-blue-500/20 text-blue-400 border border-blue-500/30
          hover:bg-blue-500/30 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading...</span>
            {uploadProgress > 0 && (
              <span className="text-xs">({uploadProgress}%)</span>
            )}
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
