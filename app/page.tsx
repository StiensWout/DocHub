"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Search, BookOpen, ChevronRight, Layers, Plus, FolderKanban, Settings } from "lucide-react";
import { getTeams, getApplications, getAllDocumentsForApp, getApplicationGroups } from "@/lib/supabase/queries";
import TeamSelector from "@/components/TeamSelector";
import DocumentViewer from "@/components/DocumentViewer";
import DocumentEditor from "@/components/DocumentEditor";
import NewDocumentDialog from "@/components/NewDocumentDialog";
import SearchBar from "@/components/SearchBar";
import FileUploadButton from "@/components/FileUploadButton";
import ApplicationFileList from "@/components/ApplicationFileList";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import ApplicationCreateDialog from "@/components/ApplicationCreateDialog";
import ApplicationGroupManager from "@/components/ApplicationGroupManager";
import ApplicationEditDialog from "@/components/ApplicationEditDialog";
import GroupSection from "@/components/GroupSection";
import ApplicationCard from "@/components/ApplicationCard";
import { useRecentDocuments } from "@/hooks/useRecentDocuments";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase/client";
import type { ApplicationWithDocs, Team, Application, Document, BreadcrumbItem, ApplicationGroup } from "@/types";
import type { SearchResult, DocumentSearchResult } from "@/lib/supabase/search";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [groups, setGroups] = useState<ApplicationGroup[]>([]);
  const [applicationsWithDocs, setApplicationsWithDocs] = useState<ApplicationWithDocs[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDocumentAppName, setSelectedDocumentAppName] = useState<string>("");
  const [selectedDocumentAppId, setSelectedDocumentAppId] = useState<string>("");
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showNewDocumentDialog, setShowNewDocumentDialog] = useState(false);
  const [showCreateApplicationDialog, setShowCreateApplicationDialog] = useState(false);
  const [showGroupManagerDialog, setShowGroupManagerDialog] = useState(false);
  const [showEditApplicationDialog, setShowEditApplicationDialog] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [newDocumentAppId, setNewDocumentAppId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Recent documents hook
  const { recentDocuments, addRecentDocument } = useRecentDocuments();
  
  // Toast notifications
  const toast = useToast();

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
      const [teamsData, appsData, groupsData] = await Promise.all([
        getTeams(),
        getApplications(),
        getApplicationGroups(),
      ]);
      
      setTeams(teamsData);
      setApplications(appsData);
      setGroups(groupsData);
      
      if (teamsData.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamsData[0].id);
      }
      
      setLoading(false);
    }
    
    loadData();
  }, []);

  // Handle app and group query parameters from URL
  useEffect(() => {
    const appParam = searchParams.get('app');
    const groupParam = searchParams.get('group');
    
    if (appParam && applications.length > 0) {
      const appExists = applications.some((a) => a.id === appParam);
      if (appExists) {
        setSelectedApp(appParam);
        setSelectedGroup(null);
        setSelectedDocument(null);
        setSelectedDocumentAppName("");
        setSelectedDocumentAppId("");
      }
    }
    
    if (groupParam && groups.length > 0) {
      const groupExists = groups.some((g) => g.id === groupParam);
      if (groupExists) {
        setSelectedGroup(groupParam);
        setSelectedApp(null);
        setSelectedDocument(null);
        setSelectedDocumentAppName("");
        setSelectedDocumentAppId("");
      }
    }
  }, [searchParams, applications, groups]);

  // Update applications with docs when team or apps change
  useEffect(() => {
    if (!selectedTeamId || applications.length === 0) return;
    refreshDocuments();
  }, [selectedTeamId, applications]);

  // Track document views for recent documents
  useEffect(() => {
    if (selectedDocument && selectedDocumentAppName) {
      addRecentDocument(selectedDocument, selectedDocumentAppName);
    }
  }, [selectedDocument?.id, selectedDocumentAppName, addRecentDocument]);

  // Scroll to top only when document first opens (not on every render)
  useEffect(() => {
    if (selectedDocument) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }, [selectedDocument?.id]);

  // Scroll to top only when editor first opens
  useEffect(() => {
    if (editingDocument) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }, [editingDocument?.id]);

  // Generate breadcrumbs based on current state
  const getBreadcrumbs = useCallback((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: "Home",
        onClick: () => {
          setSelectedApp(null);
          setSelectedGroup(null);
          setSelectedDocument(null);
          setSelectedDocumentAppName("");
          setSelectedDocumentAppId("");
          router.push("/");
        },
      },
    ];

    if (selectedTeamId) {
      const team = teams.find((t) => t.id === selectedTeamId);
      if (team) {
        items.push({
          label: team.name,
          onClick: () => {
            setSelectedApp(null);
            setSelectedDocument(null);
            setSelectedDocumentAppName("");
            setSelectedDocumentAppId("");
          },
        });
      }
    }

    if (selectedGroup) {
      const group = groups.find((g) => g.id === selectedGroup);
      if (group) {
        const GroupIcon = group.icon || Layers;
        items.push({
          label: group.name,
          icon: <GroupIcon className="w-4 h-4" />,
          onClick: () => {
            setSelectedGroup(null);
            setSelectedDocument(null);
            setSelectedDocumentAppName("");
            setSelectedDocumentAppId("");
          },
        });
      }
    }

    if (selectedApp) {
      const app = applications.find((a) => a.id === selectedApp);
      if (app) {
        const AppIcon = app.icon;
        items.push({
          label: app.name,
          icon: <AppIcon className="w-4 h-4" />,
          onClick: () => {
            setSelectedApp(null);
            setSelectedDocument(null);
            setSelectedDocumentAppName("");
            setSelectedDocumentAppId("");
          },
        });
      }
    }

    if (selectedDocument) {
      items.push({
        label: selectedDocument.title,
        onClick: undefined, // Current page, not clickable
      });
    }

    return items;
  }, [selectedTeamId, selectedApp, selectedGroup, selectedDocument, teams, applications, groups, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }

      // Ctrl/Cmd + N to create new document (only when an application is selected)
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        if (selectedApp) {
          setNewDocumentAppId(selectedApp);
          setShowNewDocumentDialog(true);
        }
      }

      // Escape to close modals/sidebar on mobile
      if (e.key === "Escape") {
        if (window.innerWidth < 1024) {
          setSidebarCollapsed(true);
        }
        if (selectedDocument && !editingDocument) {
          setSelectedDocument(null);
          setSelectedDocumentAppName("");
          setSelectedDocumentAppId("");
        }
        if (showNewDocumentDialog) {
          setShowNewDocumentDialog(false);
        }
        if (showCreateApplicationDialog) {
          setShowCreateApplicationDialog(false);
        }
        if (showGroupManagerDialog) {
          setShowGroupManagerDialog(false);
        }
        if (showEditApplicationDialog) {
          setShowEditApplicationDialog(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedApp, selectedDocument, editingDocument, showNewDocumentDialog, showCreateApplicationDialog, showGroupManagerDialog, showEditApplicationDialog]);

  // Handle document selection from sidebar
  const handleDocumentSelect = useCallback((documentId: string) => {
    // Find document in recent documents
    const doc = recentDocuments.find((d) => d.id === documentId);
    if (doc) {
      setSelectedDocument(doc);
      setSelectedDocumentAppName(doc.appName);
      const app = applications.find((a) => a.name === doc.appName);
      if (app) {
        setSelectedDocumentAppId(app.id);
        setSelectedApp(app.id);
      }
    }
  }, [recentDocuments, applications]);

  return (
    <div className="bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] flex">
      {/* Sidebar */}
      <Sidebar
        teams={teams}
        applications={applications}
        selectedTeamId={selectedTeamId}
        selectedAppId={selectedApp}
        selectedDocumentId={selectedDocument?.id || null}
        onTeamSelect={setSelectedTeamId}
        onAppSelect={(appId) => {
          setSelectedApp(appId === selectedApp ? null : appId);
          setSelectedDocument(null);
          setSelectedDocumentAppName("");
          setSelectedDocumentAppId("");
        }}
            onDocumentSelect={handleDocumentSelect}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            recentDocuments={recentDocuments}
            onHomeClick={() => {
              setSelectedApp(null);
              setSelectedGroup(null);
              setSelectedDocument(null);
              setSelectedDocumentAppName("");
              setSelectedDocumentAppId("");
            }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            {/* Breadcrumbs */}
            <div className="mb-3">
              <Breadcrumbs items={getBreadcrumbs()} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  {/* Logo hidden on mobile since sidebar button is there */}
                </div>
                <div className="hidden lg:flex items-center gap-3">
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
              </div>
              <div className="relative flex-1 max-w-md mx-8">
                <SearchBar
                  onResultClick={(result: SearchResult) => {
                    // Handle different result types
                    if (result.type === 'application') {
                      // Navigate to application
                      setSelectedApp(result.id);
                      setSelectedDocument(null);
                      setSelectedDocumentAppName("");
                      setSelectedDocumentAppId("");
                    } else if (result.type === 'group') {
                      // Navigate to group overview in main page with URL param
                      setSelectedGroup(result.id);
                      setSelectedApp(null);
                      setSelectedDocument(null);
                      setSelectedDocumentAppName("");
                      setSelectedDocumentAppId("");
                      router.push(`/?group=${result.id}`);
                    } else {
                      // Document result (existing behavior)
                      const docResult = result as DocumentSearchResult;
                      setSelectedDocument(docResult);
                      setSelectedDocumentAppName(docResult.appName);
                      setSelectedDocumentAppId(docResult.appId);
                      const app = applications.find((a) => a.name === docResult.appName);
                      if (app) {
                        setSelectedApp(app.id);
                      }
                    }
                  }}
                  teamId={selectedTeamId}
                />
              </div>
              <div className="flex items-center gap-3">
                {teams.length > 0 && (
                  <TeamSelector teams={teams} selectedTeamId={selectedTeamId} onTeamChange={setSelectedTeamId} />
                )}
                <button
                  onClick={() => setShowGroupManagerDialog(true)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm transition-all flex items-center gap-2"
                  title="Manage application groups"
                >
                  <FolderKanban className="w-4 h-4" />
                  <span className="hidden sm:inline">Groups</span>
                </button>
                <button
                  onClick={() => setShowCreateApplicationDialog(true)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 border border-purple-500 rounded-lg text-sm transition-all flex items-center gap-2"
                  title="Create new application"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New App</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Welcome Section */}
        {!selectedApp && !selectedDocument && (
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-3">Welcome back!</h2>
            <p className="text-gray-400 text-lg mb-6">
              Manage and access all your team's documentation in one place.
            </p>
            <p className="text-gray-500 text-sm">
              Use the sidebar to navigate between teams and applications, or search for documents using the search bar above.
            </p>
          </div>
        )}

        {/* Application Details */}
        {selectedApp && !selectedDocument && (
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
                onCreateDocument={() => {
                  setNewDocumentAppId(selectedApp);
                  setShowNewDocumentDialog(true);
                }}
                onEdit={() => {
                  const app = applications.find((a) => a.id === selectedApp);
                  if (app) {
                    setEditingApplication(app);
                    setShowEditApplicationDialog(true);
                  }
                }}
              />
          </div>
        )}

        {/* Document Viewer - Integrated */}
        {selectedDocument && !editingDocument && (
          <div className="mb-12">
            <DocumentViewer
              document={selectedDocument}
              appName={selectedDocumentAppName}
              appId={selectedDocumentAppId}
              teamId={selectedTeamId}
              breadcrumbs={getBreadcrumbs()}
              onClose={() => {
                setSelectedDocument(null);
                setSelectedDocumentAppName("");
                setSelectedDocumentAppId("");
              }}
              onEdit={() => {
                setEditingDocument(selectedDocument);
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
                  toast.error("Failed to delete document");
                  return;
                }

                toast.success("Document deleted successfully");
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
          </div>
        )}

        {/* Document Editor - Integrated */}
        {editingDocument && (
          <div className="mb-12">
            <DocumentEditor
              document={editingDocument}
              appId={selectedDocumentAppId || ""}
              teamId={selectedTeamId}
              breadcrumbs={getBreadcrumbs()}
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
          </div>
        )}

        {/* Group Detail View */}
        {selectedGroup && !selectedDocument && !selectedApp && (() => {
          const group = groups.find((g) => g.id === selectedGroup);
          if (!group) return null;
          
          const groupApps = applications.filter((app) => app.group_id === selectedGroup);
          
          return (
            <div>
              {/* Group Header */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  {(() => {
                    const GroupIcon = group.icon || Layers;
                    
                    // Helper function to get color values
                    function getColorValues(colorString: string) {
                      const [colorName, shade] = (colorString || 'gray-500').split('-');
                      const shadeNum = shade || '500';
                      const colorMap: Record<string, Record<string, string>> = {
                        blue: { '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb' },
                        purple: { '400': '#c084fc', '500': '#a855f7', '600': '#9333ea' },
                        green: { '400': '#4ade80', '500': '#22c55e', '600': '#16a34a' },
                        red: { '400': '#f87171', '500': '#ef4444', '600': '#dc2626' },
                        orange: { '400': '#fb923c', '500': '#f97316', '600': '#ea580c' },
                        yellow: { '400': '#facc15', '500': '#eab308', '600': '#ca8a04' },
                        indigo: { '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5' },
                        pink: { '400': '#f472b6', '500': '#ec4899', '600': '#db2777' },
                        teal: { '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488' },
                        cyan: { '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2' },
                        gray: { '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563' },
                      };
                      const baseColor = colorMap[colorName]?.[shadeNum] || colorMap.gray['500'];
                      return {
                        icon: baseColor,
                        bg: `${baseColor}20`,
                        border: `${baseColor}40`,
                      };
                    }
                    
                    const groupColors = group.color ? getColorValues(group.color) : getColorValues('gray-500');
                    
                    return (
                      <div
                        className="p-4 rounded-lg border border-white/20"
                        style={{
                          backgroundColor: groupColors.bg,
                          borderColor: groupColors.border,
                        }}
                      >
                        <GroupIcon className="w-8 h-8" style={{ color: groupColors.icon }} />
                      </div>
                    );
                  })()}
                  <div>
                    <h1 className="text-4xl font-bold mb-2">{group.name}</h1>
                    <p className="text-gray-400">
                      {groupApps.length} {groupApps.length === 1 ? 'application' : 'applications'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Applications Grid */}
              {groupApps.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>This group has no applications yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupApps.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onClick={() => {
                        router.push(`/?app=${app.id}`);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Application Groups Overview */}
        {!selectedDocument && !selectedApp && !selectedGroup && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : (
              <>
                {(() => {
                  // Group applications by group_id
                  const groupedApps: Record<string, Application[]> = {};
                  const ungroupedApps: Application[] = [];

                  applications.forEach((app) => {
                    if (app.group_id) {
                      if (!groupedApps[app.group_id]) {
                        groupedApps[app.group_id] = [];
                      }
                      groupedApps[app.group_id].push(app);
                    } else {
                      ungroupedApps.push(app);
                    }
                  });

                  // Sort groups by display_order, then by name
                  const sortedGroups = [...groups].sort((a, b) => {
                    if (a.display_order !== b.display_order) {
                      return a.display_order - b.display_order;
                    }
                    return a.name.localeCompare(b.name);
                  });

                  // Filter groups to only show those with applications
                  const groupsWithApps = sortedGroups.filter((group) => groupedApps[group.id]?.length > 0);

                  return (
                    <>
                      {/* Grouped Applications */}
                      {groupsWithApps.map((group) => (
                        <div key={group.id} className="mb-8">
                          <GroupSection
                            group={group}
                            applications={groupedApps[group.id] || []}
                            onAppClick={(appId) => {
                              router.push(`/?app=${appId}`);
                            }}
                            onGroupClick={() => router.push(`/?group=${group.id}`)}
                          />
                        </div>
                      ))}

                      {/* Ungrouped Applications */}
                      {ungroupedApps.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg border border-white/20 bg-white/5">
                              <Layers className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold">Other Applications</h3>
                              <p className="text-sm text-gray-400">
                                {ungroupedApps.length} {ungroupedApps.length === 1 ? 'application' : 'applications'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {ungroupedApps.map((app) => (
                              <ApplicationCard
                                key={app.id}
                                application={app}
                                onClick={() => {
                                  router.push(`/?app=${app.id}`);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty State */}
                      {groupsWithApps.length === 0 && ungroupedApps.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No applications found. Create an application to get started.</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </main>
      </div>
      {/* End Main Content */}

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

      {/* Create Application Dialog */}
      {showCreateApplicationDialog && (
        <ApplicationCreateDialog
          isOpen={showCreateApplicationDialog}
          onClose={() => setShowCreateApplicationDialog(false)}
          onSuccess={async () => {
            // Refresh applications list
            const updatedApps = await getApplications();
            setApplications(updatedApps);
          }}
        />
      )}

      {/* Application Group Manager Dialog */}
      {showGroupManagerDialog && (
        <ApplicationGroupManager
          isOpen={showGroupManagerDialog}
          onClose={() => setShowGroupManagerDialog(false)}
          onGroupCreated={async () => {
            // Refresh applications and groups to get updated group assignments
            const [updatedApps, updatedGroups] = await Promise.all([
              getApplications(),
              getApplicationGroups(),
            ]);
            setApplications(updatedApps);
            setGroups(updatedGroups);
          }}
        />
      )}

      {/* Edit Application Dialog */}
      {showEditApplicationDialog && editingApplication && (
        <ApplicationEditDialog
          isOpen={showEditApplicationDialog}
          application={editingApplication}
          onClose={() => {
            setShowEditApplicationDialog(false);
            setEditingApplication(null);
          }}
          onSuccess={async () => {
            // Refresh applications list
            const updatedApps = await getApplications();
            setApplications(updatedApps);
            // Update selected app if it was the one being edited
            if (editingApplication && selectedApp === editingApplication.id) {
              const updatedApp = updatedApps.find((a) => a.id === editingApplication.id);
              if (updatedApp) {
                setSelectedApp(updatedApp.id);
              }
            }
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
  onCreateDocument,
  onEdit,
}: {
  appId: string;
  teamId: string;
  onClose: () => void;
  onDocumentClick: (doc: Document, appName: string) => void;
  setSelectedDocumentAppId: (appId: string) => void;
  onCreateDocument: () => void;
  onEdit: () => void;
}) {
  const [app, setApp] = useState<ApplicationWithDocs | null>(null);
  const [loading, setLoading] = useState(true);
  const [filesKey, setFilesKey] = useState(0); // Force re-render of file list

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
          {(() => {
            // Parse color string (e.g., "blue-500") and apply it
            const [colorName, shade] = (app.color || 'blue-500').split('-');
            const shadeNum = shade || '500';
            const colorMap: Record<string, Record<string, string>> = {
              blue: { '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb' },
              purple: { '400': '#c084fc', '500': '#a855f7', '600': '#9333ea' },
              green: { '400': '#4ade80', '500': '#22c55e', '600': '#16a34a' },
              red: { '400': '#f87171', '500': '#ef4444', '600': '#dc2626' },
              orange: { '400': '#fb923c', '500': '#f97316', '600': '#ea580c' },
              yellow: { '400': '#facc15', '500': '#eab308', '600': '#ca8a04' },
              indigo: { '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5' },
              pink: { '400': '#f472b6', '500': '#ec4899', '600': '#db2777' },
              teal: { '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488' },
              cyan: { '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2' },
            };
            const bgColor = colorMap[colorName]?.[shadeNum] || colorMap.blue['500'];
            const iconColor = colorMap[colorName]?.[shadeNum] || colorMap.blue['500'];
            return (
              <div 
                className="p-3 rounded-lg border border-white/20"
                style={{ 
                  backgroundColor: `${bgColor}20`,
                  borderColor: `${bgColor}40`
                }}
              >
                <app.icon className="w-6 h-6" style={{ color: iconColor }} />
              </div>
            );
          })()}
          <div>
            <h3 className="text-2xl font-bold">{app.name}</h3>
            <p className="text-sm text-gray-400">
              {app.baseDocuments.length} base documents • {app.teamDocuments.length} team documents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateDocument}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 border border-blue-500 rounded-lg text-sm transition-all flex items-center gap-2"
            title="Create new document"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Document</span>
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm transition-all flex items-center gap-2"
            title="Edit application"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all"
          >
            Close
          </button>
        </div>
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

      {/* Application Files Section */}
      <div className="mt-8 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            Application Files
          </h4>
        </div>
        
        {/* File Upload Dropzone */}
        <div className="mb-4">
          <FileUploadButton
            applicationId={appId}
            teamId={teamId}
            variant="dropzone"
            onUploadSuccess={() => {
              setFilesKey((prev) => prev + 1); // Refresh file list
            }}
          />
        </div>

        {/* Application Files List */}
        <ApplicationFileList
          key={filesKey}
          applicationId={appId}
          teamId={teamId}
          onFileDeleted={() => {
            setFilesKey((prev) => prev + 1); // Refresh file list
          }}
        />
      </div>
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