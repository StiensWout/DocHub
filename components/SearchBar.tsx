"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Filter } from "lucide-react";
import { searchDocuments, getCategories, type SearchFilters } from "@/lib/supabase/search";
import { getApplications } from "@/lib/supabase/queries";
import type { SearchResult } from "@/lib/supabase/search";
import type { Application } from "@/types";

interface SearchBarProps {
  onResultClick: (result: SearchResult) => void;
  teamId: string;
}

export default function SearchBar({ onResultClick, teamId }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ teamId });
  const [showFilters, setShowFilters] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Perform search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const searchResults = await searchDocuments(query, filters);
      setResults(searchResults);
      setIsOpen(true);
      setIsSearching(false);
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
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

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

  return (
    <div className="relative flex-1 max-w-md mx-8" ref={inputRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        placeholder="Search documentation..."
        className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-gray-500 transition-all"
      />
      {query && (
        <button
          onClick={() => {
            setQuery("");
            setResults([]);
            setIsOpen(false);
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
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
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
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      onResultClick(result);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="w-full text-left p-4 hover:bg-white/5 transition-colors group"
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
