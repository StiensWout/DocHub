"use client";

import { useState, useEffect } from "react";
import { FileText, X, Search } from "lucide-react";
import { getTemplates, defaultTemplates, type DocumentTemplate } from "@/lib/templates";

interface TemplateSelectorProps {
  appId: string;
  onSelectTemplate: (template: DocumentTemplate) => void;
  onClose: () => void;
}

export default function TemplateSelector({
  appId,
  onSelectTemplate,
  onClose,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadTemplates() {
      setLoading(true);
      const dbTemplates = await getTemplates(appId);
      // Combine default templates with database templates
      const allTemplates = [...defaultTemplates, ...dbTemplates];
      setTemplates(allTemplates);
      setLoading(false);
    }
    loadTemplates();
  }, [appId]);

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, DocumentTemplate[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Select a Template</h2>
            <p className="text-sm text-gray-400 mt-1">Choose a template to start your document</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading templates...</div>
          ) : Object.keys(groupedTemplates).length === 0 ? (
            <div className="text-center py-12 text-gray-400">No templates found</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-white mb-4">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => onSelectTemplate(template)}
                        className="group p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                              {template.name}
                            </h4>
                            {template.description && (
                              <p className="text-sm text-gray-400 line-clamp-2">
                                {template.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
