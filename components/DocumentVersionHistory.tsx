"use client";

import { useState, useEffect } from "react";
import { X, Clock, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import DOMPurify from "dompurify";
import { supabase } from "@/lib/supabase/client";
import type { Document } from "@/types";

interface DocumentVersion {
  id: string;
  version_number: number;
  content: string | null;
  title: string;
  category: string;
  change_summary: string | null;
  created_at: string;
  isCurrent?: boolean; // Flag to mark current version
}

interface DocumentVersionHistoryProps {
  document: Document;
  onClose: () => void;
  onRestoreVersion?: (version: DocumentVersion) => void;
}

export default function DocumentVersionHistory({
  document,
  onClose,
  onRestoreVersion,
}: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);

  useEffect(() => {
    async function loadVersions() {
      setLoading(true);
      
      // Fetch historical versions
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", document.id)
        .eq("document_type", document.type)
        .order("version_number", { ascending: false });

      if (error) {
        console.error("Error loading versions:", error);
        setLoading(false);
        return;
      }

      const historicalVersions = data || [];
      
      // Fetch current document to get the latest state
      const tableName = document.type === "base" ? "base_documents" : "team_documents";
      const { data: currentDocData, error: currentDocError } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", document.id)
        .single();

      if (currentDocError) {
        console.error("Error loading current document:", currentDocError);
        setLoading(false);
        return;
      }

      // Create current version entry
      const maxVersionNumber = historicalVersions.length > 0 
        ? Math.max(...historicalVersions.map(v => v.version_number))
        : 0;
      
      const currentVersion: DocumentVersion = {
        id: `current-${document.id}`,
        version_number: maxVersionNumber + 1,
        content: currentDocData?.content || null,
        title: currentDocData?.title || document.title,
        category: currentDocData?.category || document.category,
        change_summary: "Current version",
        created_at: currentDocData?.updated_at || new Date().toISOString(),
        isCurrent: true,
      };

      // Combine current version with historical versions, current first
      const allVersions = [currentVersion, ...historicalVersions];
      
      setVersions(allVersions);
      setSelectedVersion(currentVersion); // Show current version by default
      setLoading(false);
    }

    loadVersions();
  }, [document]);

  const handleRestoreVersion = async (version: DocumentVersion) => {
    if (
      !confirm(
        `Are you sure you want to restore version ${version.version_number}? This will create a new version with the restored content.`
      )
    ) {
      return;
    }

    if (onRestoreVersion) {
      onRestoreVersion(version);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">Version History</h2>
            <p className="text-sm text-gray-400">{document.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Version List Sidebar */}
          <div className="w-80 border-r border-white/10 overflow-y-auto bg-[#0a0a0a]">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                Versions ({versions.length > 0 ? `${versions.length - 1} historical + current` : 'Loading...'})
              </h3>
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading versions...</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No versions found</div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedVersion?.id === version.id
                          ? "bg-blue-500/20 border border-blue-500/50"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">
                          {version.isCurrent ? "Current Version" : `Version ${version.version_number}`}
                        </span>
                        {version.isCurrent && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mb-1">
                        {formatDate(version.created_at)}
                      </div>
                      {version.change_summary && (
                        <div className="text-xs text-gray-500 mt-1">
                          {version.change_summary}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Version Content View */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedVersion ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {selectedVersion.isCurrent ? "Current Version" : `Version ${selectedVersion.version_number}`}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{formatDate(selectedVersion.created_at)}</span>
                      {selectedVersion.change_summary && (
                        <>
                          <span>•</span>
                          <span>{selectedVersion.change_summary}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!selectedVersion.isCurrent && (
                    <button
                      onClick={() => handleRestoreVersion(selectedVersion)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore Version
                    </button>
                  )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Title</h4>
                    <p className="text-white">{selectedVersion.title}</p>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Category</h4>
                    <p className="text-white">{selectedVersion.category}</p>
                  </div>
                  {selectedVersion.content && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Content</h4>
                      <div
                        className="prose prose-invert max-w-none bg-[#0a0a0a] p-4 rounded border border-white/5"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(selectedVersion.content, {
                            ALLOWED_TAGS: [
                              'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                              'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
                              'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins'
                            ],
                            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
                            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
                          })
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                Select a version to view its content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
