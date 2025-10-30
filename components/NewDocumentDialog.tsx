import { useState } from "react";
import { FileText, Search, BookOpen, Code, ChevronRight, Layers, Plus } from "lucide-react";
import { getTeams, getApplications, getAllDocumentsForApp } from "@/lib/supabase/queries";
import TeamSelector from "@/components/TeamSelector";
import DocumentViewer from "@/components/DocumentViewer";
import DocumentEditor from "@/components/DocumentEditor";
import TemplateSelector from "@/components/TemplateSelector";
import { supabase } from "@/lib/supabase/client";
import type { ApplicationWithDocs, Team, Application, Document } from "@/types";
import type { DocumentTemplate } from "@/lib/templates";

interface NewDocumentDialogProps {
  appId: string;
  teamId: string;
  onClose: () => void;
  onCreated: () => void;
}

function NewDocumentDialog({ appId, teamId, onClose, onCreated }: NewDocumentDialogProps) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [documentType, setDocumentType] = useState<"base" | "team">("team");
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !category.trim()) {
      alert("Please fill in title and category");
      return;
    }

    if (!teamId || !appId) {
      alert("Please select a team and application");
      return;
    }

    try {
      const tableName = documentType === "base" ? "base_documents" : "team_documents";
      const insertData: any = {
        application_id: appId,
        title: title.trim(),
        category: category.trim(),
        content: selectedTemplate?.content || "",
      };

      if (documentType === "team") {
        insertData.team_id = teamId;
      }

      const { error, data } = await supabase.from(tableName).insert(insertData).select();

      if (error) {
        console.error("Error creating document:", error);
        alert(`Failed to create document: ${error.message || JSON.stringify(error)}`);
        return;
      }

      onCreated();
      onClose();
    } catch (err: any) {
      console.error("Error creating document:", err);
      alert(`Failed to create document: ${err.message || "Unknown error"}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold mb-6">Create New Document</h2>

        <div className="space-y-4">
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
          </div>

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
              Template (Optional)
            </label>
            {selectedTemplate ? (
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-sm text-gray-300">{selectedTemplate.name}</span>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-left text-gray-400"
              >
                Select a template...
              </button>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-all"
            >
              Create
            </button>
          </div>
        </div>

        {showTemplateSelector && (
          <TemplateSelector
            appId={appId}
            onSelectTemplate={(template) => {
              setSelectedTemplate(template);
              setShowTemplateSelector(false);
            }}
            onClose={() => setShowTemplateSelector(false)}
          />
        )}
      </div>
    </div>
  );
}

export default NewDocumentDialog;
