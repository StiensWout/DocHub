"use client";

import { X, Edit, Trash2, Clock, Printer, Download, Share2 } from "lucide-react";
import { useState } from "react";
import DocumentVersionHistory from "./DocumentVersionHistory";
import FileList from "./FileList";
import Breadcrumbs from "./Breadcrumbs";
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
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  if (!document) return null;

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle export to PDF
  const handleExportPDF = async () => {
    if (!document) return;
    
    setIsExporting(true);
    try {
      // Dynamic import for html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = window.document.getElementById(`document-content-${document.id}`);
      if (!element) {
        toast.error("Could not find document content");
        return;
      }

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${document.title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
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
    if (!document || !teamId || !appId) {
      toast.error("Cannot generate share link");
      return;
    }

    const shareUrl = `${window.location.origin}/documents/${teamId}/${appId}/${document.id}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Link copied to clipboard!");
      setShowShareDialog(false);
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  // Get share URL
  const getShareUrl = () => {
    if (!document || !teamId || !appId) return "";
    return `${window.location.origin}/documents/${teamId}/${appId}/${document.id}`;
  };

  // Render HTML content safely
  const renderContent = (content: string | undefined) => {
    if (!content) return <p className="text-gray-400 italic">No content available</p>;

    return (
      <div
        id={`document-content-${document.id}`}
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
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
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
                title="Edit document"
                aria-label="Edit document"
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
