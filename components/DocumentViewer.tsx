"use client";

import { X, Edit, Trash2 } from "lucide-react";
import type { Document } from "@/types";

interface DocumentViewerProps {
  document: Document | null;
  appName: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function DocumentViewer({ document, appName, onClose, onEdit, onDelete }: DocumentViewerProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{document.title}</h2>
              {document.type === "base" && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs">
                  Shared
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{appName}</span>
              <span className="text-gray-600">•</span>
              <span className="px-2 py-0.5 bg-white/5 rounded text-xs">
                {document.category}
              </span>
              <span className="text-gray-600">•</span>
              <span>{document.updated}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Edit document"
              >
                <Edit className="w-5 h-5 text-gray-400" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete document"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent(document.content)}
        </div>
      </div>
    </div>
  );
}
