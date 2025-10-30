"use client";

import { useState, useEffect } from "react";
import type React from "react";
import {
  BookOpen,
  ChevronRight,
  Home,
  FileText,
  Star,
  Plus,
  Upload,
  Menu,
  X,
  Clock,
} from "lucide-react";
import type { Team, Application, Document, RecentDocument } from "@/types";

interface SidebarProps {
  teams: Team[];
  applications: Application[];
  selectedTeamId: string | null;
  selectedAppId: string | null;
  selectedDocumentId: string | null;
  onTeamSelect: (teamId: string) => void;
  onAppSelect: (appId: string) => void;
  onDocumentSelect?: (documentId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  recentDocuments?: RecentDocument[];
  onCreateDocument?: () => void;
  onUploadFile?: () => void;
  onHomeClick?: () => void;
}

const SIDEBAR_COLLAPSED_KEY = "dochub_sidebar_collapsed";

export default function Sidebar({
  teams,
  applications,
  selectedTeamId,
  selectedAppId,
  selectedDocumentId,
  onTeamSelect,
  onAppSelect,
  onDocumentSelect,
  collapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse,
  recentDocuments = [],
  onCreateDocument,
  onUploadFile,
  onHomeClick,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Use external collapsed state if provided, otherwise use internal
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = externalToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  // Load sidebar state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) {
        setInternalCollapsed(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading sidebar state:", error);
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (externalCollapsed === undefined) {
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(internalCollapsed));
      } catch (error) {
        console.error("Error saving sidebar state:", error);
      }
    }
  }, [internalCollapsed, externalCollapsed]);

  const handleAppClick = (appId: string) => {
    onAppSelect(appId);
    if (window.innerWidth < 1024) {
      setMobileOpen(false); // Close on mobile after selection
    }
  };

  const handleTeamClick = (teamId: string) => {
    onTeamSelect(teamId);
  };

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    }
    if (window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const totalItems = 1 + applications.length + teams.length; // Home + apps + teams
    let nextIndex: number | null = null;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        nextIndex = index < totalItems - 1 ? index + 1 : 0;
        setFocusedIndex(nextIndex);
        break;
      case "ArrowUp":
        e.preventDefault();
        nextIndex = index > 0 ? index - 1 : totalItems - 1;
        setFocusedIndex(nextIndex);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        // Trigger click action
        if (index === 0) {
          handleHomeClick();
        } else if (index <= applications.length) {
          handleAppClick(applications[index - 1].id);
        } else {
          const teamIndex = index - applications.length - 1;
          handleTeamClick(teams[teamIndex].id);
        }
        break;
      case "Escape":
        if (window.innerWidth < 1024) {
          setMobileOpen(false);
        }
        break;
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
        aria-label="Toggle sidebar"
        aria-expanded={mobileOpen}
        aria-controls="main-navigation"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="main-navigation"
        className={`
          fixed lg:sticky lg:top-0 left-0 h-screen z-40
          bg-black/40 backdrop-blur-sm border-r border-white/10
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
          touch-none lg:touch-auto
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  DocHub
                </h2>
                <p className="text-xs text-gray-400">Documentation Manager</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
          )}

          {/* Collapse Button */}
          <button
            onClick={toggleCollapse}
            className="w-full p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 mx-auto" />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Collapse</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Home */}
          <button
            onClick={handleHomeClick}
            onKeyDown={(e) => handleKeyDown(e, 0)}
            className={`
              w-full px-4 py-2 text-left flex items-center gap-3
              hover:bg-white/10 active:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
              min-h-[44px] touch-manipulation
              ${selectedAppId === null && selectedDocumentId === null
                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-l-2 border-blue-500"
                : ""
              }
              ${focusedIndex === 0 ? "ring-2 ring-blue-500 ring-inset" : ""}
            `}
            aria-label="Go to home"
            aria-current={selectedAppId === null && selectedDocumentId === null ? "page" : undefined}
            tabIndex={0}
          >
            <Home className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span className="text-sm">Home</span>}
          </button>

          {/* Applications Section - Always Visible */}
          {!collapsed && (
            <div className="px-4 py-2 mt-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2" id="applications-heading">
                Applications
              </h3>
            </div>
          )}

          {applications.map((app, appIndex) => {
            const isAppSelected = selectedAppId === app.id;
            const AppIcon = app.icon;
            const index = appIndex + 1; // +1 for Home button

            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`
                  w-full px-4 py-2 text-left flex items-center gap-3
                  hover:bg-white/10 active:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                  min-h-[44px] touch-manipulation
                  ${isAppSelected
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-l-2 border-blue-500"
                    : ""
                  }
                  ${focusedIndex === index ? "ring-2 ring-blue-500 ring-inset" : ""}
                `}
                aria-label={`Open ${app.name} application`}
                aria-current={isAppSelected ? "page" : undefined}
                aria-describedby={!collapsed ? "applications-heading" : undefined}
                tabIndex={0}
              >
                {collapsed ? (
                  <AppIcon className="w-4 h-4 flex-shrink-0 mx-auto" aria-hidden="true" />
                ) : (
                  <>
                    <AppIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm truncate">{app.name}</span>
                  </>
                )}
              </button>
            );
          })}

          {/* Teams Section */}
          {!collapsed && (
            <div className="px-4 py-2 mt-4 border-t border-white/10">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2" id="teams-heading">
                Teams
              </h3>
            </div>
          )}

          {teams.map((team, teamIndex) => {
            const isSelected = selectedTeamId === team.id;
            const index = teamIndex + applications.length + 1; // +1 for Home, +applications.length

            return (
              <button
                key={team.id}
                onClick={() => handleTeamClick(team.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`
                  w-full px-4 py-2 text-left flex items-center gap-2
                  hover:bg-white/10 active:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                  min-h-[44px] touch-manipulation
                  ${isSelected ? "bg-white/5" : ""}
                  ${focusedIndex === index ? "ring-2 ring-blue-500 ring-inset" : ""}
                `}
                aria-label={`Select ${team.name} team`}
                aria-current={isSelected ? "page" : undefined}
                aria-describedby={!collapsed ? "teams-heading" : undefined}
                tabIndex={0}
              >
                {!collapsed && (
                  <span className="text-sm truncate flex-1">{team.name}</span>
                )}
                {collapsed && (
                  <div className="w-4 h-4 rounded bg-white/10 flex-shrink-0 mx-auto" aria-hidden="true" />
                )}
              </button>
            );
          })}

          {/* Quick Access Section */}
          {!collapsed && recentDocuments.length > 0 && (
            <>
              <div className="px-4 py-2 mt-4 border-t border-white/10">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Quick Access
                </h3>
              </div>

              {/* Recent Documents */}
              <div className="px-4 py-2">
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Recent Documents</span>
                </div>
                <div className="space-y-1">
                  {recentDocuments.slice(0, 5).map((doc) => {
                    const isSelected = selectedDocumentId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          if (onDocumentSelect) {
                            onDocumentSelect(doc.id);
                          }
                          if (window.innerWidth < 1024) {
                            setMobileOpen(false);
                          }
                        }}
                        className={`
                          w-full px-3 py-1.5 text-left text-xs
                          hover:bg-white/10 rounded transition-colors
                          ${isSelected ? "bg-white/5" : ""}
                          truncate
                        `}
                        title={doc.title}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {doc.appName}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Actions Section */}
          {!collapsed && (
            <>
              <div className="px-4 py-2 mt-4 border-t border-white/10">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Actions
                </h3>
              </div>

              {onCreateDocument && (
                <button
                  onClick={() => {
                    onCreateDocument();
                    if (window.innerWidth < 1024) {
                      setMobileOpen(false);
                    }
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Document</span>
                </button>
              )}

              {onUploadFile && (
                <button
                  onClick={() => {
                    onUploadFile();
                    if (window.innerWidth < 1024) {
                      setMobileOpen(false);
                    }
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload File</span>
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
