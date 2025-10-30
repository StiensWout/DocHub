"use client";

import { useState, useEffect, useCallback } from "react";

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

const SEARCH_HISTORY_KEY = "dochub_search_history";
const MAX_HISTORY_ITEMS = 50;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  }, []);

  // Save search to history
  const saveSearch = useCallback((query: string, resultCount?: number) => {
    if (!query.trim()) return;

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item.query !== query);
      // Add to beginning
      const updated = [
        { query: query.trim(), timestamp: Date.now(), resultCount },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS); // Limit to MAX_HISTORY_ITEMS

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving search history:", error);
      }

      return updated;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  }, []);

  // Remove specific item from history
  const removeHistoryItem = useCallback((query: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.query !== query);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
      } catch (error) {
        console.error("Error removing search history item:", error);
      }
      return filtered;
    });
  }, []);

  // Get recent searches (last N items)
  const getRecentSearches = useCallback((limit: number = 8): SearchHistoryItem[] => {
    return history.slice(0, limit);
  }, [history]);

  return {
    history,
    saveSearch,
    clearHistory,
    removeHistoryItem,
    getRecentSearches,
  };
}

