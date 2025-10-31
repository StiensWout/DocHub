"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import TagSelector, { type Tag } from "./TagSelector";
import { useToast } from "./Toast";
import type { Document } from "@/types";

interface DocumentMetadataEditorProps {
  document: Document;
  appId: string;
  teamId?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function DocumentMetadataEditor({
  document,
  appId,
  teamId,
  onClose,
  onSave,
}: DocumentMetadataEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [category, setCategory] = useState(document.category);
  const [documentType, setDocumentType] = useState<"base" | "team">(document.type);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Load document tags
  useEffect(() => {
    async function loadTags() {
      try {
        const response = await fetch(
          `/api/documents/${document.id}/tags?type=${document.type}`
        );
        if (response.ok) {
          const data = await response.json();
          setSelectedTags(data.tags || []);
        }
      } catch (error) {
        console.error("Error loading document tags:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTags();
  }, [document.id, document.type]);

  const handleSave = async () => {
    if (!title.trim() || !category.trim()) {
      toast.error("Title and category are required");
      return;
    }

    setIsSaving(true);
    try {
      const tableName = documentType === "base" ? "base_documents" : "team_documents";

      // Update document metadata
      const updateData: any = {
        title: title.trim(),
        category: category.trim(),
        updated_at: new Date().toISOString(),
      };

      // If document type changed, we need to move the document
      if (documentType !== document.type) {
        // First, get the current document data
        const currentTable = document.type === "base" ? "base_documents" : "team_documents";
        const { data: currentDoc } = await supabase
          .from(currentTable)
          .select("*")
          .eq("id", document.id)
          .single();

        if (!currentDoc) {
          toast.error("Document not found");
          return;
        }

        // Insert into new table
        const newDocData: any = {
          application_id: appId,
          title: title.trim(),
          category: category.trim(),
          content: currentDoc.content,
        };

        if (documentType === "team") {
          if (!teamId) {
            toast.error("Team ID is required for team documents");
            return;
          }
          newDocData.team_id = teamId;
        }

        const { data: newDoc, error: insertError } = await supabase
          .from(tableName)
          .insert(newDocData)
          .select()
          .single();

        if (insertError) {
          console.error("Error moving document:", insertError);
          toast.error("Failed to update document");
          return;
        }

        // Copy tags to new document
        if (selectedTags.length > 0) {
          const tagIds = selectedTags.map((tag) => tag.id);
          await fetch(`/api/documents/${newDoc.id}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagIds, documentType }),
          });
        }

        // Delete old document
        await supabase.from(currentTable).delete().eq("id", document.id);

        toast.success("Document updated successfully");
        onSave();
        onClose();
        return;
      }

      // Update existing document
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", document.id);

      if (error) {
        console.error("Error updating document:", error);
        toast.error("Failed to update document");
        return;
      }

      // Update tags
      // First, remove all existing tags
      await fetch(`/api/documents/${document.id}/tags?type=${document.type}`, {
        method: "DELETE",
      });

      // Then add new tags
      if (selectedTags.length > 0) {
        const tagIds = selectedTags.map((tag) => tag.id);
        const tagResponse = await fetch(`/api/documents/${document.id}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagIds, documentType }),
        });

        if (!tagResponse.ok) {
          console.error("Failed to update tags");
          // Don't fail the whole operation if tags fail
        }
      }

      toast.success("Document updated successfully");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update document");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-400 mt-4">Loading document tags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Edit Document Metadata</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Documentation, Guide, Setup"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Document Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDocumentType("team")}
                className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                  documentType === "team"
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                    : "bg-white/5 border-white/10 text-gray-300"
                }`}
              >
                Team Document
              </button>
              <button
                onClick={() => setDocumentType("base")}
                className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                  documentType === "base"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                    : "bg-white/5 border-white/10 text-gray-300"
                }`}
              >
                Base Document (Shared)
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Changing document type will move the document between base and team documents.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              placeholder="Add tags to categorize this document..."
              maxTags={10}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

