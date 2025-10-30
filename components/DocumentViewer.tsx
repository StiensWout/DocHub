"use client";

import { X, Edit, Trash2, Clock } from "lucide-react";
import { useState } from "react";
import DocumentVersionHistory from "./DocumentVersionHistory";
import FileList from "./FileList";
import Breadcrumbs from "./Breadcrumbs";
import { useToast } from "./Toast";
import { supabase } from "@/lib/supabase/client";
import type { Document, BreadcrumbItem } from "@/types";

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
  const toast = useToast();

  if (!document) return null;

  // Render HTML content safely
  const renderContent = (content: string | undefined) => {
    if (!content) return <p className="text-gray-400 italic">No content available</p>;

    return (
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  return (
    <div className="w-full animate-[fadeIn_0.3s_ease-in-out]">
      <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background-tertiary z-10">
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
          <div className="mt-8 pt-8 border-t border-border">
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
