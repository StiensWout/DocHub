"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Filter, Clock, FolderOpen, History, Layers, Box } from "lucide-react";
import { searchDocuments, getCategories, getDocumentTitles, getCategorySuggestions, searchApplications, searchApplicationGroups, getApplicationSuggestions, getGroupSuggestions, type SearchFilters, type SearchResult, type ApplicationSearchResult, type GroupSearchResult, type DocumentSearchResult } from "@/lib/supabase/search";
import { getApplications } from "@/lib/supabase/queries";
import { useSearchHistory, type SearchHistoryItem } from "@/hooks/useSearchHistory";
import type { Application } from "@/types";
import * as LucideIcons from "lucide-react";

interface SearchBarProps {
  onResultClick: (result: SearchResult) => void;
  teamId: string;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'document' | 'category' | 'recent' | 'application' | 'group';
  icon?: React.ReactNode;
}

export default function SearchBar({ onResultClick, teamId }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [applicationResults, setApplicationResults] = useState<ApplicationSearchResult[]>([]);
  const [groupResults, setGroupResults] = useState<GroupSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({ teamId });
  const [showFilters, setShowFilters] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [resultTypeFilter, setResultTypeFilter] = useState<'all' | 'applications' | 'groups' | 'documents'>('all');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { history, saveSearch, clearHistory, removeHistoryItem, getRecentSearches } = useSearchHistory();

  // Load applications and categories
  useEffect(() => {
    async function loadData() {
      const [appsData, catsData] = await Promise.all([
        getApplications(),
        getCategories(teamId),
      ]);
      setApplications(appsData);
      setCategories(catsData);
    }
    loadData();
  }, [teamId]);

  // Update filters when team changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, teamId }));
  }, [teamId]);

  // Load suggestions when query changes (1+ characters)
  useEffect(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    if (!query.trim() || query.trim().length < 1) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    suggestionTimeoutRef.current = setTimeout(async () => {
      const queryLower = query.trim().toLowerCase();
      const suggestionList: SearchSuggestion[] = [];

      // Get document title suggestions
      const titles = await getDocumentTitles(query, filters);
      titles.forEach((title, index) => {
        suggestionList.push({
          id: `doc-${index}`,
          text: title,
          type: 'document',
          icon: <Search className="w-4 h-4" />,
        });
      });

      // Get category suggestions
      const categorySuggestions = await getCategorySuggestions(query, teamId);
      categorySuggestions.forEach((cat, index) => {
        suggestionList.push({
          id: `cat-${index}`,
          text: cat,
          type: 'category',
          icon: <FolderOpen className="w-4 h-4" />,
        });
      });

      // Get application suggestions
      const appSuggestions = await getApplicationSuggestions(query);
      appSuggestions.forEach((appName, index) => {
        suggestionList.push({
          id: `app-${index}`,
          text: appName,
          type: 'application',
          icon: <Box className="w-4 h-4" />,
        });
      });

      // Get group suggestions
      const groupSuggestions = await getGroupSuggestions(query);
      groupSuggestions.forEach((groupName, index) => {
        suggestionList.push({
          id: `grp-${index}`,
          text: groupName,
          type: 'group',
          icon: <Layers className="w-4 h-4" />,
        });
      });

      // Add recent searches that match
      const recentSearches = getRecentSearches(5);
      recentSearches.forEach((item) => {
        if (item.query.toLowerCase().includes(queryLower) && !suggestionList.some(s => s.text === item.query)) {
          suggestionList.push({
            id: `recent-${item.timestamp}`,
            text: item.query,
            type: 'recent',
            icon: <Clock className="w-4 h-4" />,
          });
        }
      });

      setSuggestions(suggestionList.slice(0, 8));
      setIsLoadingSuggestions(false);
    }, 200);

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [query, filters, teamId, getRecentSearches]);

  // Perform search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      if (query.trim().length === 0) {
        setIsOpen(false);
      }
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const [documentResults, appResults, groupResults] = await Promise.all([
        searchDocuments(query, filters),
        searchApplications(query),
        searchApplicationGroups(query),
      ]);
      setResults(documentResults);
      setApplicationResults(appResults);
      setGroupResults(groupResults);
      setIsOpen(true);
      setIsSearching(false);
      // Don't save history here - only save when user clicks a result or presses Enter
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters]);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        inputRef.current && 
        !inputRef.current.contains(target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    if (isOpen || isFocused) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, isFocused]);

  // Build a flat array of all visible results for keyboard navigation
  const getAllVisibleResults = (): SearchResult[] => {
    const visible: SearchResult[] = [];
    visible.push(...filteredApplicationResults);
    visible.push(...filteredGroupResults);
    visible.push(...filteredDocumentResults);
    return visible;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0 && query.length >= 1 && query.length < 2) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionSelect(suggestions[activeSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsFocused(false);
        setActiveSuggestionIndex(-1);
      }
    } else if (totalResults > 0 && query.length >= 2) {
      const visibleResults = getAllVisibleResults();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => 
          prev < visibleResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
        e.preventDefault();
        if (activeSuggestionIndex < visibleResults.length) {
          saveSearch(query, totalResults);
          onResultClick(visibleResults[activeSuggestionIndex]);
          setIsOpen(false);
          setQuery("");
          setActiveSuggestionIndex(-1);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsFocused(false);
        setActiveSuggestionIndex(-1);
      }
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
    // Save when selecting a suggestion (user intent to search)
    saveSearch(suggestion.text, 0);
  };

  const handleRecentSearchClick = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setIsFocused(true);
    inputRef.current?.focus();
    // Re-saving recent search to move it to top
    saveSearch(item.query, item.resultCount);
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return `${Math.floor(diffDays / 7)}w ago`;
    }
  };

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/20 text-yellow-300">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Helper function to get color values from Tailwind color string
  const getColorValues = (colorString: string) => {
    if (!colorString) return { icon: '#9ca3af', bg: '#9ca3af33', border: '#9ca3af80' };
    const [colorName, shade] = colorString.split('-');
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
    const baseColor = colorMap[colorName]?.[shadeNum] || colorMap.blue['500'];
    return {
      icon: baseColor,
      bg: `${baseColor}33`,
      border: `${baseColor}80`,
    };
  };

  // Get filtered results based on resultTypeFilter
  const filteredApplicationResults = resultTypeFilter === 'all' || resultTypeFilter === 'applications' ? applicationResults : [];
  const filteredGroupResults = resultTypeFilter === 'all' || resultTypeFilter === 'groups' ? groupResults : [];
  const filteredDocumentResults = resultTypeFilter === 'all' || resultTypeFilter === 'documents' ? results : [];
  
  const totalResults = filteredApplicationResults.length + filteredGroupResults.length + filteredDocumentResults.length;

  const recentSearches = getRecentSearches(8);
  const showRecentSearches = isFocused && query.length === 0 && recentSearches.length > 0;
  const showSuggestions = isFocused && query.length >= 1 && query.length < 2 && suggestions.length > 0;
  const showResults = isOpen && query.length >= 2;

  return (
    <div className="relative flex-1 max-w-md mx-8" ref={inputRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveSuggestionIndex(-1);
        }}
        onFocus={() => {
          setIsFocused(true);
          if (query.length >= 2) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search documentation..."
        className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-gray-500 transition-all"
      />
      {query && (
        <button
          onClick={() => {
            setQuery("");
            setResults([]);
            setApplicationResults([]);
            setGroupResults([]);
            setSuggestions([]);
            setIsOpen(false);
            setActiveSuggestionIndex(-1);
            setResultTypeFilter('all');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {isSearching && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Filters Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-white/10 transition-all ${
          showFilters ? "bg-white/10" : ""
        }`}
        title="Filters"
      >
        <Filter className="w-4 h-4 text-gray-400" />
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-full mt-2 right-0 bg-[#1a1a1a] border border-white/10 rounded-lg p-4 shadow-xl z-50 min-w-[280px]">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Application
              </label>
              <select
                value={filters.applicationId || ""}
                onChange={(e) =>
                  setFilters({ ...filters, applicationId: e.target.value || undefined })
                }
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
              >
                <option value="">All Applications</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value || undefined })
                }
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Document Type
              </label>
              <select
                value={filters.documentType || "all"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    documentType: e.target.value === "all" ? undefined : (e.target.value as "base" | "team"),
                  })
                }
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
              >
                <option value="all">All Documents</option>
                <option value="base">Base Documents</option>
                <option value="team">Team Documents</option>
              </select>
            </div>

            {(filters.applicationId || filters.category || filters.documentType) && (
              <button
                onClick={() => setFilters({ teamId })}
                className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Searches Dropdown */}
      {showRecentSearches && (
        <div
          ref={suggestionsRef}
          className="absolute top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto w-full"
        >
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <History className="w-4 h-4" />
              <span>Recent Searches</span>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="divide-y divide-white/5">
            {recentSearches.map((item) => (
              <button
                key={item.timestamp}
                onClick={() => handleRecentSearchClick(item)}
                className="w-full text-left p-3 hover:bg-white/5 transition-colors group flex items-center justify-between"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                    {item.query}
                  </span>
                </div>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto w-full"
        >
          {isLoadingSuggestions ? (
            <div className="p-4 text-center text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-white/10 text-xs text-gray-400">
                Suggestions
              </div>
              <div className="divide-y divide-white/5">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`w-full text-left p-3 hover:bg-white/5 transition-colors group flex items-center gap-2 ${
                      index === activeSuggestionIndex ? "bg-white/5" : ""
                    }`}
                  >
                    {suggestion.icon}
                    <span className="text-sm text-white group-hover:text-blue-400 transition-colors flex-1">
                      {highlightMatch(suggestion.text, query)}
                    </span>
                    {suggestion.type === 'recent' && (
                      <Clock className="w-3 h-3 text-gray-500" />
                    )}
                    {suggestion.type === 'category' && (
                      <FolderOpen className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 max-h-[600px] overflow-y-auto w-full">
          {totalResults === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <p>No results found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 flex gap-1 p-2 z-10">
                <button
                  onClick={() => setResultTypeFilter('all')}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    resultTypeFilter === 'all'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  All ({applicationResults.length + groupResults.length + results.length})
                </button>
                {applicationResults.length > 0 && (
                  <button
                    onClick={() => setResultTypeFilter('applications')}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${
                      resultTypeFilter === 'applications'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Apps ({applicationResults.length})
                  </button>
                )}
                {groupResults.length > 0 && (
                  <button
                    onClick={() => setResultTypeFilter('groups')}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${
                      resultTypeFilter === 'groups'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Groups ({groupResults.length})
                  </button>
                )}
                {results.length > 0 && (
                  <button
                    onClick={() => setResultTypeFilter('documents')}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${
                      resultTypeFilter === 'documents'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Docs ({results.length})
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/5">
                {/* Application Results */}
                {filteredApplicationResults.length > 0 && (
                  <>
                    {resultTypeFilter === 'all' && (
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-white/5">
                        Applications ({filteredApplicationResults.length})
                      </div>
                    )}
                    {filteredApplicationResults.map((appResult, index) => {
                      const AppIcon = (LucideIcons[appResult.icon_name as keyof typeof LucideIcons] as any) || Box;
                      const colors = getColorValues(appResult.color);
                      // Calculate the global index: applications come first, then groups, then documents
                      const globalIndex = index;
                      return (
                        <button
                          key={`app-${appResult.id}`}
                          onClick={() => {
                            saveSearch(query, totalResults);
                            onResultClick(appResult as SearchResult);
                            setIsOpen(false);
                            setQuery("");
                            setActiveSuggestionIndex(-1);
                          }}
                          className={`w-full text-left p-4 hover:bg-white/5 transition-colors group ${
                            globalIndex === activeSuggestionIndex ? "bg-white/5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: colors.bg,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              <AppIcon className="w-5 h-5" style={{ color: colors.icon }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-0.5">
                                {highlightMatch(appResult.name, query)}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="truncate">{appResult.id}</span>
                                {appResult.document_count !== undefined && (
                                  <>
                                    <span>•</span>
                                    <span>{appResult.document_count} {appResult.document_count === 1 ? 'document' : 'documents'}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Group Results */}
                {filteredGroupResults.length > 0 && (
                  <>
                    {resultTypeFilter === 'all' && (
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-white/5">
                        Groups ({filteredGroupResults.length})
                      </div>
                    )}
                    {filteredGroupResults.map((groupResult, index) => {
                      const GroupIcon = groupResult.icon_name
                        ? ((LucideIcons[groupResult.icon_name as keyof typeof LucideIcons] as any) || Layers)
                        : Layers;
                      const colors = groupResult.color ? getColorValues(groupResult.color) : getColorValues('gray-500');
                      // Calculate the global index: applications first, then groups
                      const globalIndex = filteredApplicationResults.length + index;
                      return (
                        <button
                          key={`group-${groupResult.id}`}
                          onClick={() => {
                            saveSearch(query, totalResults);
                            onResultClick(groupResult as SearchResult);
                            setIsOpen(false);
                            setQuery("");
                            setActiveSuggestionIndex(-1);
                          }}
                          className={`w-full text-left p-4 hover:bg-white/5 transition-colors group ${
                            globalIndex === activeSuggestionIndex ? "bg-white/5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: colors.bg,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              <GroupIcon className="w-5 h-5" style={{ color: colors.icon }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-0.5">
                                {highlightMatch(groupResult.name, query)}
                              </h4>
                              <div className="text-xs text-gray-400">
                                {groupResult.application_count} {groupResult.application_count === 1 ? 'application' : 'applications'}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Document Results */}
                {filteredDocumentResults.length > 0 && (
                  <>
                    {resultTypeFilter === 'all' && (
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-white/5">
                        Documents ({filteredDocumentResults.length})
                      </div>
                    )}
                    {filteredDocumentResults.map((result, index) => {
                      // Type assertion: filteredDocumentResults only contains DocumentSearchResult
                      const docResult = result as DocumentSearchResult;
                      // Calculate the global index: applications first, then groups, then documents
                      const globalIndex = filteredApplicationResults.length + filteredGroupResults.length + index;
                      return (
                        <button
                          key={`doc-${docResult.id}`}
                          onClick={() => {
                            saveSearch(query, totalResults);
                            onResultClick(docResult);
                            setIsOpen(false);
                            setQuery("");
                            setActiveSuggestionIndex(-1);
                          }}
                          className={`w-full text-left p-4 hover:bg-white/5 transition-colors group ${
                            globalIndex === activeSuggestionIndex ? "bg-white/5" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                  {highlightMatch(docResult.title, query)}
                                </h4>
                                {docResult.type === "base" && (
                                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs flex-shrink-0">
                                    Shared
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                <span>{docResult.appName}</span>
                                <span>•</span>
                                <span>{docResult.category}</span>
                                <span>•</span>
                                <span>{docResult.updated}</span>
                              </div>
                              {docResult.content && (
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                  {highlightMatch(
                                    docResult.content.replace(/<[^>]*>/g, "").substring(0, 150),
                                    query
                                  )}
                                  ...
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
