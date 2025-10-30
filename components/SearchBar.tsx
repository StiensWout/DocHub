"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Filter, Clock, FolderOpen, History } from "lucide-react";
import { searchDocuments, getCategories, getDocumentTitles, getCategorySuggestions, type SearchFilters } from "@/lib/supabase/search";
import { getApplications } from "@/lib/supabase/queries";
import { useSearchHistory, type SearchHistoryItem } from "@/hooks/useSearchHistory";
import type { SearchResult } from "@/lib/supabase/search";
import type { Application } from "@/types";

interface SearchBarProps {
  onResultClick: (result: SearchResult) => void;
  teamId: string;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'document' | 'category' | 'recent';
  icon?: React.ReactNode;
}

export default function SearchBar({ onResultClick, teamId }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
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
      const searchResults = await searchDocuments(query, filters);
      setResults(searchResults);
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
    } else if (results.length > 0 && query.length >= 2) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
        e.preventDefault();
        saveSearch(query, results.length);
        onResultClick(results[activeSuggestionIndex]);
        setIsOpen(false);
        setQuery("");
        setActiveSuggestionIndex(-1);
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
            setSuggestions([]);
            setIsOpen(false);
            setActiveSuggestionIndex(-1);
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
          {results.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <p>No documents found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-white/10 text-xs text-gray-400">
                Found {results.length} {results.length === 1 ? "result" : "results"}
              </div>
              <div className="divide-y divide-white/5">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      // Save search history when user clicks a result
                      saveSearch(query, results.length);
                      onResultClick(result);
                      setIsOpen(false);
                      setQuery("");
                      setActiveSuggestionIndex(-1);
                    }}
                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors group ${
                      index === activeSuggestionIndex ? "bg-white/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {highlightMatch(result.title, query)}
                          </h4>
                          {result.type === "base" && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs flex-shrink-0">
                              Shared
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <span>{result.appName}</span>
                          <span>•</span>
                          <span>{result.category}</span>
                          <span>•</span>
                          <span>{result.updated}</span>
                        </div>
                        {result.content && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {highlightMatch(
                              result.content.replace(/<[^>]*>/g, "").substring(0, 150),
                              query
                            )}
                            ...
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
