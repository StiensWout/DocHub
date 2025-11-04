"use client";

import { X, Edit, Trash2, Clock, Printer, Download, Share2, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import DocumentVersionHistory from "./DocumentVersionHistory";
import DocumentMetadataEditor from "./DocumentMetadataEditor";
import FileList from "./FileList";
import Breadcrumbs from "./Breadcrumbs";
import TagDisplay, { type Tag } from "./TagDisplay";
import { useToast } from "./Toast";
import { supabase } from "@/lib/supabase/client";
import type { Document, BreadcrumbItem } from "@/types";
import TurndownService from "turndown";
import html2pdf from "html2pdf.js";

interface DocumentViewerProps {
  document: Document | null;
  appName: string;
  appId?: string;
  teamId?: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onVersionRestored?: () => void;
  breadcrumbs?: BreadcrumbItem[];
}

export default function DocumentViewer({ document, appName, appId, teamId, onClose, onEdit, onDelete, onVersionRestored, breadcrumbs }: DocumentViewerProps) {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [documentTags, setDocumentTags] = useState<Tag[]>([]);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const toast = useToast();

  // Validate document access when document changes
  useEffect(() => {
    async function validateAccess() {
      // Use appId prop or fallback to document.appId
      const effectiveAppId = appId || document?.appId;
      
      console.log('[DocumentViewer] Starting access validation', {
        documentId: document?.id,
        documentType: document?.type,
        appId: effectiveAppId,
        appIdProp: appId,
        documentAppId: document?.appId,
        teamId,
        hasDocument: !!document,
      });

      if (!document || !effectiveAppId || !teamId) {
        console.log('[DocumentViewer] Missing required fields, skipping validation', {
          hasDocument: !!document,
          hasAppId: !!effectiveAppId,
          appIdProp: !!appId,
          documentAppId: !!document?.appId,
          hasTeamId: !!teamId,
        });
        setHasAccess(null);
        return;
      }

      // Set timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn('[DocumentViewer] ⚠️ Document access validation timed out after 5s, allowing access');
        setHasAccess(true); // Fail open - allow access if validation times out
      }, 5000); // 5 second timeout

      try {
        const requestBody = {
          documentId: document.id,
          documentType: document.type,
          teamId,
          appId: effectiveAppId,
        };
        console.log('[DocumentViewer] Sending access validation request', requestBody);

        const response = await fetch('/api/documents/validate-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        console.log('[DocumentViewer] Received response', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // If response is not OK, fail open (allow access) since user already passed GET filter
          console.warn('[DocumentViewer] ⚠️ Response not OK, allowing access', {
            status: response.status,
            statusText: response.statusText,
          });
          setHasAccess(true);
          return;
        }

        const data = await response.json();
        console.log('[DocumentViewer] Response data', data);

        if (!data.hasAccess) {
          console.warn('[DocumentViewer] ❌ Access denied');
          setHasAccess(false);
          toast.error('You no longer have access to this document');
          // Close the document viewer after a short delay
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          console.log('[DocumentViewer] ✅ Access granted');
          setHasAccess(true);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('[DocumentViewer] ❌ Error validating document access:', error);
        // Fail open - allow access if there's an error (user already passed GET filter)
        setHasAccess(true);
      }
    }

    validateAccess();
  }, [document, appId, teamId, onClose, toast]);

  // Load document tags
  useEffect(() => {
    async function loadTags() {
      if (!document || !appId) return;
      try {
        const response = await fetch(
          `/api/documents/${document.id}/tags?type=${document.type}`
        );
        if (response.ok) {
          const data = await response.json();
          setDocumentTags(data.tags || []);
        }
      } catch (error) {
        console.error("Error loading document tags:", error);
      }
    }

    loadTags();
  }, [document, appId]);

  if (!document) return null;

  // Show loading state while checking access
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Verifying access...</div>
      </div>
    );
  }

  // Show access denied message
  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-400 font-semibold mb-2">Access Denied</div>
        <div className="text-gray-400 text-sm mb-4">You no longer have access to this document.</div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm"
        >
          Close
        </button>
      </div>
    );
  }

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle export to PDF
  const handleExportPDF = async () => {
    if (!document) return;
    
    setIsExporting(true);
    let tempContainer: HTMLElement | null = null;
    
    try {
      // Dynamic import for html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = window.document.getElementById(`document-content-${document.id}`);
      if (!element) {
        toast.error("Could not find document content");
        return;
      }

      // Create a clone of the element
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Remove the prose-invert class and add print-friendly classes
      clone.classList.remove('prose-invert');
      clone.classList.add('prose');
      
      // Apply print-friendly base styles
      clone.style.backgroundColor = 'white';
      clone.style.color = 'black';
      clone.style.padding = '40px';
      clone.style.maxWidth = '8.5in';
      clone.style.margin = '0 auto';
      clone.style.fontSize = '16px';
      clone.style.lineHeight = '1.6';
      
      // Create a style element with print-friendly CSS
      const style = window.document.createElement('style');
      style.textContent = `
        .pdf-export * {
          color: black !important;
        }
        .pdf-export h1,
        .pdf-export h2,
        .pdf-export h3,
        .pdf-export h4,
        .pdf-export h5,
        .pdf-export h6 {
          color: black !important;
          font-weight: bold;
        }
        .pdf-export strong,
        .pdf-export b {
          color: black !important;
          font-weight: bold;
        }
        .pdf-export code {
          background-color: #f5f5f5 !important;
          color: black !important;
          border: 1px solid #e0e0e0 !important;
        }
        .pdf-export pre {
          background-color: #f5f5f5 !important;
          color: black !important;
          border: 1px solid #e0e0e0 !important;
        }
        .pdf-export a {
          color: #0066cc !important;
        }
        .pdf-export blockquote {
          border-left-color: #ccc !important;
          color: #666 !important;
        }
        .pdf-export table {
          border-color: #e0e0e0 !important;
        }
        .pdf-export th,
        .pdf-export td {
          border-color: #e0e0e0 !important;
          color: black !important;
        }
      `;
      
      // Add the PDF export class
      clone.classList.add('pdf-export');
      
      // Create a temporary container
      tempContainer = window.document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '8.5in';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '0';
      tempContainer.appendChild(style);
      tempContainer.appendChild(clone);
      window.document.body.appendChild(tempContainer);

      // Wait a bit for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${document.title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 816, // 8.5in at 96 DPI
          windowHeight: 1056, // 11in at 96 DPI
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(clone).save();
      
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      // Clean up temporary container regardless of success or failure
      if (tempContainer && tempContainer.parentNode) {
        window.document.body.removeChild(tempContainer);
      }
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Handle export to Markdown
  const handleExportMarkdown = () => {
    if (!document || !document.content) return;

    try {
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      });

      // Convert HTML to Markdown
      const markdown = turndownService.turndown(document.content);
      
      // Add document title as header
      const fullMarkdown = `# ${document.title}\n\n${markdown}`;

      // Create blob and download
      const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title}.md`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Markdown exported successfully!");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Error exporting Markdown:", error);
      toast.error("Failed to export Markdown");
    }
  };

  // Handle share link
  const handleShare = () => {
    const shareUrl = getShareUrl();
    
    if (!shareUrl) {
      toast.error("Cannot generate share link");
      return;
    }

    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Link copied to clipboard!");
      setShowShareDialog(false);
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  // Get share URL
  const getShareUrl = () => {
    if (!document || !appId) return "";
    // For base documents, use "base" as teamId placeholder
    const shareTeamId = document.type === "base" ? "base" : teamId || "base";
    return `${window.location.origin}/documents/${shareTeamId}/${appId}/${document.id}`;
  };

  // Render HTML content safely
  const renderContent = (content: string | undefined) => {
    if (!content) return <p className="text-gray-400 italic">No content available</p>;

    // Sanitize HTML content to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
        'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });

    return (
      <div className="print-content">
        {/* Print-only header */}
        <div className="document-print-header hidden print:block">
          <h1 className="document-print-title">{document.title}</h1>
          <div className="document-print-meta">
            {appName} • {document.category} • {document.updated}
          </div>
        </div>
        
        <div
          id={`document-content-${document.id}`}
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
    );
  };

  return (
    <div className="w-full animate-[fadeIn_0.3s_ease-in-out]">
      <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background-tertiary z-10 no-print">
          <div className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="mb-3">
                <Breadcrumbs items={breadcrumbs} />
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white truncate">{document.title}</h2>
              {document.type === "base" && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs flex-shrink-0">
                  Shared
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-foreground-secondary flex-wrap">
              <span>{appName}</span>
              <span className="text-foreground-muted">•</span>
              <span className="px-2 py-0.5 bg-glass rounded text-xs">
                {document.category}
              </span>
              <span className="text-foreground-muted">•</span>
              <span>{document.updated}</span>
            </div>
            {documentTags.length > 0 && (
              <div className="mt-2">
                <TagDisplay tags={documentTags} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
              title="Print document"
              aria-label="Print document"
            >
              <Printer className="w-5 h-5 text-foreground-secondary" />
            </button>
            
            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className="p-2 hover:bg-glass-hover rounded-lg transition-colors disabled:opacity-50"
                title="Export document"
                aria-label="Export document"
              >
                <Download className="w-5 h-5 text-foreground-secondary" />
              </button>
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-background-tertiary border border-border rounded-lg shadow-theme-lg z-50 min-w-[160px]">
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-glass-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? "Exporting..." : "Export to PDF"}
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      disabled={isExporting}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-glass-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export to Markdown
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowShareDialog(true)}
              className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
              title="Share document"
              aria-label="Share document"
            >
              <Share2 className="w-5 h-5 text-foreground-secondary" />
            </button>

            <button
              onClick={() => setShowVersionHistory(true)}
              className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
              title="View version history"
              aria-label="View version history"
            >
              <Clock className="w-5 h-5 text-foreground-secondary" />
            </button>
            <button
              onClick={() => setShowMetadataEditor(true)}
              className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
              title="Edit document metadata"
              aria-label="Edit document metadata"
            >
              <Settings className="w-5 h-5 text-foreground-secondary" />
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
                title="Edit document content"
                aria-label="Edit document content"
              >
                <Edit className="w-5 h-5 text-foreground-secondary" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 hover:bg-error/20 rounded-lg transition-colors"
                title="Delete document"
                aria-label="Delete document"
              >
                <Trash2 className="w-5 h-5 text-error" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
              aria-label="Close document"
            >
              <X className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {renderContent(document.content)}
          
          {/* File List */}
          <div className="mt-8 pt-8 border-t border-border no-print">
            <FileList
              documentId={document.id}
              documentType={document.type}
              applicationId={appId}
              teamId={teamId}
              onFileDeleted={() => {
                // Reload page or refresh document if needed
              }}
            />
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay">
          <div
            className="fixed inset-0"
            onClick={() => setShowShareDialog(false)}
          />
          <div className="relative bg-background-tertiary border border-border rounded-xl p-6 max-w-md w-full shadow-theme-xl">
            <h3 className="text-xl font-bold mb-4">Share Document</h3>
            <p className="text-sm text-foreground-secondary mb-4">
              Anyone with this link can view the document:
            </p>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover rounded-lg text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowShareDialog(false)}
              className="w-full px-4 py-2 bg-glass hover:bg-glass-hover rounded-lg text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Metadata Editor Modal */}
      {showMetadataEditor && document && appId && (
        <DocumentMetadataEditor
          document={document}
          appId={appId}
          teamId={teamId}
          onClose={() => setShowMetadataEditor(false)}
          onSave={async () => {
            // Reload tags after save
            const tagsResponse = await fetch(
              `/api/documents/${document.id}/tags?type=${document.type}`
            );
            if (tagsResponse.ok) {
              const tagsData = await tagsResponse.json();
              setDocumentTags(tagsData.tags || []);
            }
            // Call onVersionRestored if available to trigger refresh
            if (onVersionRestored) {
              onVersionRestored();
            }
          }}
        />
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <DocumentVersionHistory
          document={document}
          onClose={() => setShowVersionHistory(false)}
          onRestoreVersion={async (version) => {
            // Restore version by updating document with version content
            const tableName = document.type === "base" ? "base_documents" : "team_documents";
            const { error } = await supabase
              .from(tableName)
              .update({
                content: version.content,
                title: version.title,
                category: version.category,
              })
              .eq("id", document.id);

            if (error) {
              console.error("Error restoring version:", error);
              toast.error("Failed to restore version");
              return;
            }

            toast.success("Version restored successfully!");
            if (onVersionRestored) {
              onVersionRestored();
            }
            setShowVersionHistory(false);
          }}
        />
      )}
    </div>
  );
}
