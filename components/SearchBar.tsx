"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Filter, Clock, FolderOpen, History, Layers, Box, Command } from "lucide-react";
import { searchDocuments, getCategories, getDocumentTitles, getCategorySuggestions, searchApplications, searchApplicationGroups, getApplicationSuggestions, getGroupSuggestions, type SearchFilters, type SearchResult, type ApplicationSearchResult, type GroupSearchResult, type DocumentSearchResult } from "@/lib/supabase/search";
import { getApplications } from "@/lib/supabase/queries";
import { useSearchHistory, type SearchHistoryItem } from "@/hooks/useSearchHistory";
import TagDisplay, { type Tag } from "./TagDisplay";
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({ teamId });
  const [showFilters, setShowFilters] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [resultTypeFilter, setResultTypeFilter] = useState<'all' | 'applications' | 'groups' | 'documents'>('all');
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { history, saveSearch, clearHistory, getRecentSearches } = useSearchHistory();

  // Load applications, categories, and tags
  useEffect(() => {
    async function loadData() {
      const [appsData, catsData] = await Promise.all([
        getApplications(),
        getCategories(teamId),
      ]);
      setApplications(appsData);
      setCategories(catsData);

      // Load tags
      try {
        const tagsResponse = await fetch("/api/tags");
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setTags(tagsData.tags || []);
        }
      } catch (error) {
        console.error("Error loading tags:", error);
      }
    }
    loadData();
  }, [teamId]);

  // Update filters when team changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, teamId }));
  }, [teamId]);

  // Update filters when selected tags change
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    }));
  }, [selectedTagIds]);

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
      setApplicationResults([]);
      setGroupResults([]);
      if (query.trim().length === 0) {
        setIsOpen(false);
      }
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const [documentResults, appResults, groupResults] = await Promise.all([
          searchDocuments(query, filters),
          searchApplications(query),
          searchApplicationGroups(query),
        ]);
        setResults(documentResults);
        setApplicationResults(appResults);
        setGroupResults(groupResults);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters]);

  // Close search when clicking outside - improved implementation
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        setShowFilters(false);
        setActiveIndex(-1);
      }
    }

    if (isOpen || isFocused || showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, isFocused, showFilters]);

  // Calculate visibility states - must be defined before useCallback
  const recentSearches = getRecentSearches(8);
  const showRecentSearches = isFocused && query.length === 0 && recentSearches.length > 0;
  const showSuggestions = isFocused && query.length >= 1 && query.length < 2 && suggestions.length > 0 && !isLoadingSuggestions;
  const showResults = isOpen && query.length >= 2;

  // Calculate filtered results and total - must be before handlers
  const filteredApplicationResults = resultTypeFilter === 'all' || resultTypeFilter === 'applications' ? applicationResults : [];
  const filteredGroupResults = resultTypeFilter === 'all' || resultTypeFilter === 'groups' ? groupResults : [];
  const filteredDocumentResults = resultTypeFilter === 'all' || resultTypeFilter === 'documents' ? results : [];
  const totalResults = filteredApplicationResults.length + filteredGroupResults.length + filteredDocumentResults.length;

  // Handler functions - must be defined before useCallback
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setActiveIndex(-1);
    inputRef.current?.focus();
    saveSearch(suggestion.text, 0);
  }, [saveSearch]);

  const handleRecentSearchClick = useCallback((item: SearchHistoryItem) => {
    setQuery(item.query);
    setIsFocused(true);
    inputRef.current?.focus();
    saveSearch(item.query, item.resultCount);
  }, [saveSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    // Calculate total results at call time to avoid stale closure
    const currentTotal = applicationResults.length + groupResults.length + results.length;
    saveSearch(query, currentTotal);
    onResultClick(result);
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.blur();
  }, [query, applicationResults.length, groupResults.length, results.length, saveSearch, onResultClick]);

  // Get all visible items for keyboard navigation
  const getAllVisibleItems = useCallback(() => {
    const items: Array<{ id: string; onClick: () => void }> = [];
    
    if (showRecentSearches) {
      const recent = getRecentSearches(8);
      recent.forEach((item) => {
        items.push({
          id: `recent-${item.timestamp}`,
          onClick: () => handleRecentSearchClick(item),
        });
      });
    } else if (showSuggestions) {
      suggestions.forEach((suggestion) => {
        items.push({
          id: suggestion.id,
          onClick: () => handleSuggestionSelect(suggestion),
        });
      });
    } else if (showResults) {
      // Calculate filtered results based on current filter
      const filteredApps = resultTypeFilter === 'all' || resultTypeFilter === 'applications' ? applicationResults : [];
      const filteredGroups = resultTypeFilter === 'all' || resultTypeFilter === 'groups' ? groupResults : [];
      const filteredDocs = resultTypeFilter === 'all' || resultTypeFilter === 'documents' ? results : [];
      
      const visibleResults: SearchResult[] = [];
      visibleResults.push(...filteredApps);
      visibleResults.push(...filteredGroups);
      visibleResults.push(...filteredDocs);
      
      visibleResults.forEach((result) => {
        items.push({
          id: `result-${('id' in result ? result.id : 'unknown')}`,
          onClick: () => handleResultClick(result),
        });
      });
    }
    
    return items;
  }, [showRecentSearches, showSuggestions, showResults, suggestions, resultTypeFilter, applicationResults, groupResults, results, getRecentSearches, handleRecentSearchClick, handleSuggestionSelect, handleResultClick]);

  const getAllVisibleResults = (): SearchResult[] => {
    const visible: SearchResult[] = [];
    visible.push(...filteredApplicationResults);
    visible.push(...filteredGroupResults);
    visible.push(...filteredDocumentResults);
    return visible;
  };

  // Keyboard navigation - improved
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showFilters) {
      // Don't handle keyboard nav when filters panel is open
      if (e.key === 'Escape') {
        setShowFilters(false);
      }
      return;
    }
    
    const items = getAllVisibleItems();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        items[activeIndex].onClick();
      } else if (query.trim().length >= 2 && totalResults > 0) {
        // If no item selected, click first result
        const visibleResults = getAllVisibleResults();
        if (visibleResults.length > 0) {
          handleResultClick(visibleResults[0]);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsFocused(false);
      setShowFilters(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };


  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setApplicationResults([]);
    setGroupResults([]);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setResultTypeFilter('all');
    inputRef.current?.focus();
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-blue-500/30 text-blue-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

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

  const hasActiveFilters = filters.applicationId || filters.category || filters.documentType || selectedTagIds.length > 0;

  return (
    <div className="relative flex-1 max-w-2xl mx-auto" ref={containerRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search documentation, applications, and groups..."
          className="w-full pl-11 pr-24 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-gray-400 transition-all backdrop-blur-sm"
        />
        
        {/* Right side buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" title="Active filters" />
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg hover:bg-white/10 transition-all ${
              showFilters ? "bg-white/10 text-blue-400" : "text-gray-400"
            }`}
            title="Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          {query && (
            <button
              onClick={clearSearch}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-300 transition-all"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Keyboard shortcut hint */}
        {!isFocused && !query && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-gray-500 pointer-events-none">
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px]">⌘</kbd>
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px]">K</kbd>
          </div>
        )}
      </div>

      {/* Filters Panel - Improved positioning */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute top-full mt-2 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl p-4 shadow-2xl z-50 min-w-[320px] max-h-[80vh] overflow-y-auto backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilters({ teamId });
                    setSelectedTagIds([]);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Application
                </label>
                <select
                  value={filters.applicationId || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, applicationId: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%9ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                  }}
                >
                  <option value="" className="bg-[#1a1a1a] text-white">All Applications</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id} className="bg-[#1a1a1a] text-white">
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%9ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                  }}
                >
                  <option value="" className="bg-[#1a1a1a] text-white">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#1a1a1a] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
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
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%9ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                  }}
                >
                  <option value="all" className="bg-[#1a1a1a] text-white">All Documents</option>
                  <option value="base" className="bg-[#1a1a1a] text-white">Base Documents</option>
                  <option value="team" className="bg-[#1a1a1a] text-white">Team Documents</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 bg-white/5 rounded-lg p-2">
                  {tags.length === 0 ? (
                    <p className="text-xs text-gray-500 px-2 py-4 text-center">No tags available</p>
                  ) : (
                    tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <label
                          key={tag.id}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTagIds([...selectedTagIds, tag.id]);
                              } else {
                                setSelectedTagIds(selectedTagIds.filter((id) => id !== tag.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                          />
                          <span className="text-xs text-white">{tag.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dropdowns */}
      {(showRecentSearches || showSuggestions || showResults) && (
        <div className="absolute top-full mt-2 w-full bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[600px] overflow-hidden backdrop-blur-xl">
          {/* Recent Searches */}
          {showRecentSearches && (
            <div className="max-h-[400px] overflow-y-auto">
              <div className="p-3 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                  <History className="w-4 h-4" />
                  <span>Recent Searches</span>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearHistory();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="divide-y divide-white/5">
                {recentSearches.map((item, index) => (
                  <button
                    key={item.timestamp}
                    onClick={() => handleRecentSearchClick(item)}
                    className={`w-full text-left p-3 hover:bg-white/5 transition-colors group flex items-center justify-between ${
                      index === activeIndex ? "bg-white/5" : ""
                    }`}
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

          {/* Suggestions */}
          {showSuggestions && (
            <div className="max-h-[400px] overflow-y-auto">
              <div className="p-3 border-b border-white/10 text-xs font-medium text-gray-400">
                Suggestions
              </div>
              {isLoadingSuggestions ? (
                <div className="p-4 text-center">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={`w-full text-left p-3 hover:bg-white/5 transition-colors group flex items-center gap-2 ${
                        index === activeIndex ? "bg-white/5" : ""
                      }`}
                    >
                      {suggestion.icon}
                      <span className="text-sm text-white group-hover:text-blue-400 transition-colors flex-1">
                        {highlightMatch(suggestion.text, query)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {showResults && (
            <div className="max-h-[600px] overflow-y-auto">
              {totalResults === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No results found</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  {/* Filter Tabs */}
                  <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 flex gap-1 p-2 z-10 backdrop-blur-sm">
                    <button
                      onClick={() => setResultTypeFilter('all')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        resultTypeFilter === 'all'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      All ({applicationResults.length + groupResults.length + results.length})
                    </button>
                    <button
                      onClick={() => setResultTypeFilter('applications')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        resultTypeFilter === 'applications'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Apps ({applicationResults.length})
                    </button>
                    <button
                      onClick={() => setResultTypeFilter('groups')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        resultTypeFilter === 'groups'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Groups ({groupResults.length})
                    </button>
                    <button
                      onClick={() => setResultTypeFilter('documents')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        resultTypeFilter === 'documents'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Docs ({results.length})
                    </button>
                  </div>

                  <div className="divide-y divide-white/5">
                    {/* Application Results */}
                    {filteredApplicationResults.length > 0 && (
                      <>
                        {resultTypeFilter === 'all' && (
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-white/5 sticky top-12">
                            Applications ({filteredApplicationResults.length})
                          </div>
                        )}
                        {filteredApplicationResults.map((appResult, index) => {
                          const AppIcon = (LucideIcons[appResult.icon_name as keyof typeof LucideIcons] as any) || Box;
                          const colors = getColorValues(appResult.color);
                          const globalIndex = resultTypeFilter === 'all' 
                            ? index 
                            : (resultTypeFilter === 'applications' ? index : -1);
                          return (
                            <button
                              key={`app-${appResult.id}`}
                              onClick={() => handleResultClick(appResult as SearchResult)}
                              className={`w-full text-left p-4 hover:bg-white/5 transition-colors group ${
                                globalIndex === activeIndex ? "bg-white/5" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
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
                                        <span>{appResult.document_count} {appResult.document_count === 1 ? 'doc' : 'docs'}</span>
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
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-white/5 sticky top-12">
                            Groups ({filteredGroupResults.length})
                          </div>
                        )}
                        {filteredGroupResults.map((groupResult, index) => {
                          const GroupIcon = groupResult.icon_name
                            ? ((LucideIcons[groupResult.icon_name as keyof typeof LucideIcons] as any) || Layers)
                            : Layers;
                          const colors = groupResult.color ? getColorValues(groupResult.color) : getColorValues('gray-500');
                          const globalIndex = resultTypeFilter === 'all'
                            ? filteredApplicationResults.length + index
                            : (resultTypeFilter === 'groups' ? index : -1);
                          return (
                            <button
                              key={`group-${groupResult.id}`}
                              onClick={() => handleResultClick(groupResult as SearchResult)}
                              className={`w-full text-left p-4 hover:bg-white/5 transition-colors group ${
                                globalIndex === activeIndex ? "bg-white/5" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
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
                                    {groupResult.application_count} {groupResult.application_count === 1 ? 'app' : 'apps'}
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
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-white/5 sticky top-12">
                            Documents ({filteredDocumentResults.length})
                          </div>
                        )}
                        {filteredDocumentResults.map((result, index) => {
                          const docResult = result as DocumentSearchResult;
                          const globalIndex = resultTypeFilter === 'all'
                            ? filteredApplicationResults.length + filteredGroupResults.length + index
                            : (resultTypeFilter === 'documents' ? index : -1);
                          return (
                            <button
                              key={`doc-${docResult.id}`}
                              onClick={() => handleResultClick(docResult)}
                              className={`w-full text-left p-4 hover:bg-white/5 transition-colors group ${
                                globalIndex === activeIndex ? "bg-white/5" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                      {highlightMatch(docResult.title, query)}
                                    </h4>
                                    {docResult.type === "base" && (
                                      <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs flex-shrink-0">
                                        Shared
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5 flex-wrap">
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
      )}
    </div>
  );
}
