"use client";

import { useState, useEffect } from "react";
import { FileText, Search, BookOpen, Code, ChevronRight, Layers, Plus } from "lucide-react";
import { getTeams, getApplications, getAllDocumentsForApp } from "@/lib/supabase/queries";
import TeamSelector from "@/components/TeamSelector";
import DocumentViewer from "@/components/DocumentViewer";
import DocumentEditor from "@/components/DocumentEditor";
import NewDocumentDialog from "@/components/NewDocumentDialog";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/lib/supabase/client";
import type { ApplicationWithDocs, Team, Application, Document } from "@/types";
import type { SearchResult } from "@/lib/supabase/search";

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsWithDocs, setApplicationsWithDocs] = useState<ApplicationWithDocs[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDocumentAppName, setSelectedDocumentAppName] = useState<string>("");
  const [selectedDocumentAppId, setSelectedDocumentAppId] = useState<string>("");
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showNewDocumentDialog, setShowNewDocumentDialog] = useState(false);
  const [newDocumentAppId, setNewDocumentAppId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Function to refresh documents without page reload
  const refreshDocuments = async () => {
    if (!selectedTeamId || applications.length === 0) return;

    const appsWithDocs = await Promise.all(
      applications.map(async (app) => {
        const allDocs = await getAllDocumentsForApp(selectedTeamId, app.id);
        const teamDocs = allDocs.filter((d) => d.type === "team");
        const baseDocs = allDocs.filter((d) => d.type === "base");
        
        // Get most recent update
        const sortedDocs = [...allDocs].sort((a, b) => {
          const timeA = parseTimeAgo(a.updated);
          const timeB = parseTimeAgo(b.updated);
          return timeA - timeB;
        });
        
        return {
          ...app,
          baseDocuments: baseDocs,
          teamDocuments: teamDocs,
          totalDocuments: allDocs.length,
          lastUpdated: sortedDocs[0]?.updated || "Never",
        };
      })
    );

    setApplicationsWithDocs(appsWithDocs);

    // Get recent documents across all apps
    const allRecentDocs = appsWithDocs
      .flatMap((app) => {
        const allDocs = [...app.baseDocuments, ...app.teamDocuments];
        return allDocs.map((doc) => ({ ...doc, appName: app.name }));
      })
      .sort((a, b) => {
        const timeA = parseTimeAgo(a.updated);
        const timeB = parseTimeAgo(b.updated);
        return timeA - timeB;
      })
      .slice(0, 6);

    setRecentDocs(allRecentDocs);
  };

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [teamsData, appsData] = await Promise.all([
        getTeams(),
        getApplications(),
      ]);
      
      setTeams(teamsData);
      setApplications(appsData);
      
      if (teamsData.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamsData[0].id);
      }
      
      setLoading(false);
    }
    
    loadData();
  }, []);

  // Update applications with docs when team or apps change
  useEffect(() => {
    if (!selectedTeamId || applications.length === 0) return;
    refreshDocuments();
  }, [selectedTeamId, applications]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  DocHub
                </h1>
                <p className="text-xs text-gray-400">Documentation Manager</p>
              </div>
            </div>
            <div className="relative flex-1 max-w-md mx-8">
              <SearchBar
                onResultClick={(result) => {
                  setSelectedDocument(result);
                  setSelectedDocumentAppName(result.appName);
                  setSelectedDocumentAppId(result.appId);
                }}
                teamId={selectedTeamId}
              />
            </div>
            <div className="flex items-center gap-3">
              {teams.length > 0 && (
                <TeamSelector teams={teams} selectedTeamId={selectedTeamId} onTeamChange={setSelectedTeamId} />
              )}
              <button
                onClick={() => {
                  if (applications.length > 0) {
                    setNewDocumentAppId(applications[0].id);
                    setShowNewDocumentDialog(true);
                  }
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 border border-blue-500 rounded-lg text-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Doc
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-3">Welcome back!</h2>
          <p className="text-gray-400 text-lg">
            Manage and access all your team's documentation in one place.
          </p>
        </div>

        {/* Applications Grid */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Applications
          </h3>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading applications...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {applicationsWithDocs.map((app) => {
              const Icon = app.icon;
              const baseDocsCount = app.baseDocuments.length;
              const teamDocsCount = app.teamDocuments.length;
              
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(selectedApp === app.id ? null : app.id)}
                  className="group relative p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className={`inline-flex p-3 rounded-lg mb-4 ${app.color} border`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-semibold mb-1">{app.name}</h4>
                    <div className="flex items-center gap-3 mb-3 text-sm text-gray-400">
                      <span>{app.totalDocuments} docs</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-xs">
                        {baseDocsCount} base, {teamDocsCount} team
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>Updated {app.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* Application Details */}
        {selectedApp && (
          <div className="mb-12">
            <ApplicationDetails
              appId={selectedApp}
              teamId={selectedTeamId}
              onClose={() => setSelectedApp(null)}
              onDocumentClick={(doc, appName) => {
                setSelectedDocument(doc);
                setSelectedDocumentAppName(appName);
              }}
              setSelectedDocumentAppId={setSelectedDocumentAppId}
            />
          </div>
        )}

        {/* Recent Documents */}
        <div>
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Documents
          </h3>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : recentDocs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No documents found</div>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocument(doc);
                    setSelectedDocumentAppName(doc.appName);
                    const app = applications.find((a) => a.name === doc.appName);
                    if (app) setSelectedDocumentAppId(app.id);
                  }}
                  className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold group-hover:text-blue-400 transition-colors">
                          {doc.title}
                        </h4>
                        {doc.type === "base" && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs">
                            Shared
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{doc.appName}</span>
                        <span className="text-gray-600">•</span>
                        <span className="px-2 py-0.5 bg-white/5 rounded text-xs">
                          {doc.category}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span>{doc.updated}</span>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-300">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Document Viewer Modal */}
      {selectedDocument && !editingDocument && (
        <DocumentViewer
          document={selectedDocument}
          appName={selectedDocumentAppName}
          onClose={() => {
            setSelectedDocument(null);
            setSelectedDocumentAppName("");
            setSelectedDocumentAppId("");
          }}
          onEdit={() => {
            setEditingDocument(selectedDocument);
            setSelectedDocument(null);
          }}
          onDelete={async () => {
            if (!confirm("Are you sure you want to delete this document?")) return;
            
            const tableName = selectedDocument.type === "base" ? "base_documents" : "team_documents";
            const { error } = await supabase
              .from(tableName)
              .delete()
              .eq("id", selectedDocument.id);

            if (error) {
              console.error("Error deleting document:", error);
              alert("Failed to delete document");
              return;
            }

            setSelectedDocument(null);
            setSelectedDocumentAppName("");
            setSelectedDocumentAppId("");
            
            // Refresh documents without page reload
            await refreshDocuments();
          }}
          onVersionRestored={async () => {
            await refreshDocuments();
            // Update selected document if it was restored
            if (selectedDocument) {
              const allDocs = await getAllDocumentsForApp(selectedTeamId, selectedDocumentAppId);
              const updatedDoc = allDocs.find((d) => d.id === selectedDocument.id);
              if (updatedDoc) {
                setSelectedDocument(updatedDoc);
              }
            }
          }}
        />
      )}

      {/* Document Editor */}
      {editingDocument && (
        <DocumentEditor
          document={editingDocument}
          appId={selectedDocumentAppId || ""}
          teamId={selectedTeamId}
          onSave={async () => {
            await refreshDocuments();
            // Update selected document if it was the one being edited
            if (editingDocument) {
              const allDocs = await getAllDocumentsForApp(selectedTeamId, selectedDocumentAppId);
              const updatedDoc = allDocs.find((d) => d.id === editingDocument.id);
              if (updatedDoc) {
                setSelectedDocument(updatedDoc);
              }
            }
            setEditingDocument(null);
          }}
          onClose={() => {
            setEditingDocument(null);
            setSelectedDocumentAppId("");
          }}
        />
      )}

      {/* New Document Dialog */}
      {showNewDocumentDialog && (
        <NewDocumentDialog
          appId={newDocumentAppId}
          teamId={selectedTeamId}
          onClose={() => {
            setShowNewDocumentDialog(false);
            setNewDocumentAppId("");
          }}
          onCreated={async () => {
            await refreshDocuments();
          }}
        />
      )}
    </div>
  );
}

function ApplicationDetails({
  appId,
  teamId,
  onClose,
  onDocumentClick,
  setSelectedDocumentAppId,
}: {
  appId: string;
  teamId: string;
  onClose: () => void;
  onDocumentClick: (doc: Document, appName: string) => void;
  setSelectedDocumentAppId: (appId: string) => void;
}) {
  const [app, setApp] = useState<ApplicationWithDocs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppDetails() {
      setLoading(true);
      const apps = await getApplications();
      const foundApp = apps.find((a) => a.id === appId);
      if (!foundApp) {
        setLoading(false);
        return;
      }

      const allDocs = await getAllDocumentsForApp(teamId, appId);
      const teamDocs = allDocs.filter((d) => d.type === "team");
      const baseDocs = allDocs.filter((d) => d.type === "base");

      setApp({
        ...foundApp,
        baseDocuments: baseDocs,
        teamDocuments: teamDocs,
        totalDocuments: allDocs.length,
        lastUpdated: "Never",
      });
      setLoading(false);
    }

    loadAppDetails();
  }, [appId, teamId]);

  if (!app || loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${app.color} border`}>
            <app.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{app.name}</h3>
            <p className="text-sm text-gray-400">
              {app.baseDocuments.length} base documents • {app.teamDocuments.length} team documents
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all"
        >
          Close
        </button>
      </div>

      {/* Base Documents */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          Base Documents (Shared)
        </h4>
        <div className="space-y-2">
          {app.baseDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => {
                onDocumentClick(doc, app.name);
                setSelectedDocumentAppId(app.id);
              }}
              className="group p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium group-hover:text-purple-400 transition-colors">
                      {doc.title}
                    </h5>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs">
                      Shared
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="px-2 py-0.5 bg-white/5 rounded text-xs">
                      {doc.category}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span>{doc.updated}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Documents */}
      {app.teamDocuments.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Team Documents
          </h4>
          <div className="space-y-2">
            {app.teamDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  onDocumentClick(doc, app.name);
                }}
                className="group p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium mb-1 group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </h5>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="px-2 py-0.5 bg-white/5 rounded text-xs">
                        {doc.category}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span>{doc.updated}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to parse "time ago" strings
function parseTimeAgo(timeAgo: string): number {
  const match = timeAgo.match(/(\d+)\s*(hour|day|week|minute)s?\s*ago/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    minute: 1,
    hour: 60,
    day: 1440,
    week: 10080,
  };

  return value * (multipliers[unit] || 0);
}