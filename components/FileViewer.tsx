"use client";

import Image from "next/image";

import { useState, useEffect, useRef } from "react";
import { X, Download, ZoomIn, ZoomOut, Maximize2, Loader2, Edit, Save } from "lucide-react";
import { renderAsync } from "docx-preview";
import DOMPurify from "dompurify";
import { isMimeTypeAllowed, getFileExtension } from "@/lib/constants/file-validation";
import type { DocumentFile } from "@/types";
import { supabase } from "@/lib/supabase/client";

interface FileViewerProps {
  file: DocumentFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FileViewer({ file, isOpen, onClose }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // PDF state
  const [scale, setScale] = useState(1.0);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [docxRendered, setDocxRendered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const [docxArrayBuffer, setDocxArrayBuffer] = useState<ArrayBuffer | null>(null);


  useEffect(() => {
    if (!file || !isOpen) {
      setFileUrl(null);
      setTextContent(null);
      setDocxRendered(false);
      setDocxArrayBuffer(null);
      setScale(1.0);
      setIsEditing(false);
      setEditedContent("");
      // Clear docx container using safe DOM manipulation (prevents XSS)
      if (docxContainerRef.current) {
        while (docxContainerRef.current.firstChild) {
          docxContainerRef.current.removeChild(docxContainerRef.current.firstChild);
        }
      }
      return;
    }

    // Get file URL
    const loadFile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data } = supabase.storage
          .from(file.storage_bucket)
          .getPublicUrl(file.file_path);

        if (data?.publicUrl) {
          setFileUrl(data.publicUrl);
          
          // Check if it's a DOCX file using shared validation
          const isDocx = file.file_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                       file.file_type === "application/msword";
          const fileExtension = getFileExtension(file.file_name);
          const isValidDocx = isDocx && (fileExtension === ".docx" || fileExtension === ".doc");
          
          if (isValidDocx) {
            // Load DOCX file and store arrayBuffer for rendering when container is ready
            try {
              const response = await fetch(data.publicUrl);
              const arrayBuffer = await response.arrayBuffer();
              setDocxArrayBuffer(arrayBuffer);
              setLoading(false);
            } catch (docxErr) {
              console.error("Error loading DOCX:", docxErr);
              setError(`Failed to load DOCX file: ${docxErr instanceof Error ? docxErr.message : "Unknown error"}`);
              setLoading(false);
            }
          } else if (file.file_type.startsWith("text/") || 
              file.file_type === "application/json" ||
              file.file_type === "application/xml" ||
              file.file_type === "application/x-yaml" ||
              file.file_type.includes("javascript") ||
              file.file_type.includes("typescript") ||
              file.file_type.includes("python") ||
              file.file_type.includes("java") ||
              file.file_type.includes("css") ||
              file.file_type.includes("html")) {
            const response = await fetch(data.publicUrl);
            const text = await response.text();
            setTextContent(text);
            setEditedContent(text);
          }
        } else {
          throw new Error("Could not get file URL");
        }
      } catch (err) {
        console.error("Error loading file:", err);
        setError("Failed to load file");
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [file, isOpen]);

  // Render DOCX when container ref is available
  useEffect(() => {
    if (docxArrayBuffer && docxContainerRef.current && !docxRendered) {
      const renderDocx = async () => {
        try {
          // Clear container using safe DOM manipulation (prevents XSS)
          const container = docxContainerRef.current!;
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
          
          try {
            // renderAsync writes HTML directly to the DOM, so we sanitize after rendering
            await renderAsync(docxArrayBuffer, container, null, {
              className: "docx-wrapper",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              ignoreLastRenderedPageBreak: true,
              experimental: false,
              trimXmlDeclaration: true,
              useBase64URL: true,
              useMathMLPolyfill: true,
              showChanges: false,
            });
            
            // Sanitize the rendered HTML to prevent XSS attacks
            // Use permissive config to preserve document structure while removing scripts
            const sanitizedHTML = DOMPurify.sanitize(container.innerHTML, {
              ALLOWED_TAGS: [
                'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
                'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins',
                'section', 'article', 'header', 'footer', 'nav', 'figure', 'figcaption'
              ],
              ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'data-*'],
              ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
              KEEP_CONTENT: true,
            });
            container.innerHTML = sanitizedHTML;
            
            setDocxRendered(true);
          } catch (renderErr) {
            console.error("docx-preview render error:", renderErr);
            // Fallback: try without wrapper
            try {
              await renderAsync(docxArrayBuffer, docxContainerRef.current!, null, {
                inWrapper: false,
              });
              // Sanitize the fallback rendered HTML as well
              const fallbackContainer = docxContainerRef.current!;
              const sanitizedFallbackHTML = DOMPurify.sanitize(fallbackContainer.innerHTML, {
                ALLOWED_TAGS: [
                  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
                  'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins',
                  'section', 'article', 'header', 'footer', 'nav', 'figure', 'figcaption'
                ],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'data-*'],
                ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
                KEEP_CONTENT: true,
              });
              fallbackContainer.innerHTML = sanitizedFallbackHTML;
              setDocxRendered(true);
            } catch (fallbackErr) {
              console.error("docx-preview fallback error:", fallbackErr);
              setError(`Failed to render DOCX file: ${fallbackErr instanceof Error ? fallbackErr.message : "Unknown error"}`);
            }
          }
        } catch (err) {
          console.error("Error rendering DOCX:", err);
          setError(`Failed to render DOCX file: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      };
      
      renderDocx();
    }
  }, [docxArrayBuffer, docxRendered]);

  useEffect(() => {
    // Handle escape key to close
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!file || !editedContent) return;
    
    setIsSaving(true);
    try {
      // Create a new File object with updated content
      const blob = new Blob([editedContent], { type: file.file_type });
      const updatedFile = new File([blob], file.file_name, { type: file.file_type });
      
      // Use the replace API endpoint
      const formData = new FormData();
      formData.append("file", updatedFile);
      
      const response = await fetch(`/api/files/${file.id}`, {
        method: "PUT",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Save failed");
      }
      
      // Update local state
      setTextContent(editedContent);
      setIsEditing(false);
      
      // Reload file URL to get updated version
      const { data: urlData } = supabase.storage
        .from(file.storage_bucket)
        .getPublicUrl(file.file_path);
      setFileUrl(urlData.publicUrl);
      
    } catch (err) {
      console.error("Error saving file:", err);
      alert(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  const isPDF = file?.file_type === "application/pdf";
  const isImage = file?.file_type.startsWith("image/");
  const isDocx = file?.file_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                file?.file_type === "application/msword" ||
                file?.file_name.toLowerCase().endsWith(".docx") ||
                file?.file_name.toLowerCase().endsWith(".doc");
  const isText = file?.file_type.startsWith("text/") || 
                 file?.file_type === "application/json" ||
                 file?.file_type === "application/xml" ||
                 file?.file_type === "application/x-yaml" ||
                 file?.file_type.includes("javascript") ||
                 file?.file_type.includes("typescript") ||
                 file?.file_type.includes("python") ||
                 file?.file_type.includes("java") ||
                 file?.file_type.includes("css") ||
                 file?.file_type.includes("html");
  const isEditable = isText && textContent !== null;

  if (!isOpen || !file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`
          relative bg-gray-900 border border-gray-700 rounded-lg shadow-2xl
          flex flex-col max-w-7xl w-full h-full max-h-[95vh] m-4
          ${isFullscreen ? "max-w-full max-h-full m-0 rounded-none" : ""}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-200 truncate">
              {file.file_name}
            </h3>
            <span className="text-sm text-gray-400">
              {file.file_type.split("/")[1]?.toUpperCase() || "FILE"}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* PDF Controls */}
            {isPDF && (
              <>
                <button
                  onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                  className="
                    p-2 rounded hover:bg-gray-700/50 transition-colors
                    text-gray-400 hover:text-white
                  "
                  title="Zoom out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                
                <span className="text-sm text-gray-400 px-2 min-w-[3rem] text-center">
                  {Math.round(scale * 100)}%
                </span>
                
                <button
                  onClick={() => setScale(Math.min(2.0, scale + 0.25))}
                  className="
                    p-2 rounded hover:bg-gray-700/50 transition-colors
                    text-gray-400 hover:text-white
                  "
                  title="Zoom in"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-gray-700 mx-2" />

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="
                    p-2 rounded hover:bg-gray-700/50 transition-colors
                    text-gray-400 hover:text-white
                  "
                  title="Toggle fullscreen"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </>
            )}

            {isEditable && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="
                  p-2 rounded hover:bg-gray-700/50 transition-colors
                  text-gray-400 hover:text-green-400
                "
                title="Edit file"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}

            {isEditable && isEditing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="
                    p-2 rounded hover:bg-gray-700/50 transition-colors
                    text-gray-400 hover:text-green-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Save changes"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(textContent || "");
                  }}
                  disabled={isSaving}
                  className="
                    p-2 rounded hover:bg-gray-700/50 transition-colors
                    text-gray-400 hover:text-gray-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Cancel editing"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={handleDownload}
              className="
                p-2 rounded hover:bg-gray-700/50 transition-colors
                text-gray-400 hover:text-blue-400
              "
              title="Download file"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="
                p-2 rounded hover:bg-gray-700/50 transition-colors
                text-gray-400 hover:text-red-400
              "
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-950">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="text-gray-400">Loading file...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="
                    px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400
                    border border-blue-500/30 hover:bg-blue-500/30
                    transition-colors
                  "
                >
                  Download File Instead
                </button>
              </div>
            </div>
          ) : isPDF && fileUrl ? (
            <div className="flex items-center justify-center h-full w-full overflow-auto">
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${Math.round(scale * 100)}`}
                className="border-0"
                style={{
                  width: `${scale * 100}%`,
                  height: 'calc(95vh - 120px)',
                  minHeight: '600px',
                }}
                title={file.file_name}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError("Failed to load PDF");
                  setLoading(false);
                }}
              />
            </div>
          ) : isImage && fileUrl ? (
            <div className="flex items-center justify-center h-full">
              <Image
                src={fileUrl}
                alt={file.file_name}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: "calc(95vh - 120px)" }}
              />
            </div>
          ) : isDocx ? (
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
              <style>{`
                .docx-wrapper {
                  background: white;
                  padding: 2rem;
                  margin: 0 auto;
                  max-width: 8.5in;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                  min-height: 11in;
                }
              `}</style>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="text-gray-400">Loading DOCX file...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={handleDownload}
                      className="
                        px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400
                        border border-blue-500/30 hover:bg-blue-500/30
                        transition-colors
                      "
                    >
                      Download File Instead
                    </button>
                  </div>
                </div>
              ) : (
                <div ref={docxContainerRef} className="docx-wrapper" />
              )}
            </div>
          ) : isText && textContent !== null ? (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="
                    flex-1 w-full bg-gray-800 p-4 rounded-lg
                    text-sm text-gray-200 font-mono
                    resize-none outline-none
                    border border-gray-700 focus:border-blue-500
                    overflow-auto
                  "
                  placeholder="File content..."
                  autoFocus
                />
              ) : (
                <pre className="
                  bg-gray-800 p-4 rounded-lg overflow-auto
                  text-sm text-gray-200 font-mono
                  whitespace-pre-wrap break-words
                  flex-1
                ">
                  {textContent}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  Preview not available for this file type
                </p>
                <button
                  onClick={handleDownload}
                  className="
                    px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400
                    border border-blue-500/30 hover:bg-blue-500/30
                    transition-colors
                  "
                >
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

