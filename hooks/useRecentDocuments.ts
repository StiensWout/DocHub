"use client";

import { useState, useEffect, useCallback } from "react";
import type { Document, RecentDocument } from "@/types";

const RECENT_DOCUMENTS_KEY = "dochub_recent_documents";
const MAX_RECENT_DOCUMENTS = 10;

export function useRecentDocuments() {
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);

  // Load recent documents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_DOCUMENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentDocuments(parsed);
      }
    } catch (error) {
      console.error("Error loading recent documents:", error);
    }
  }, []);

  // Add a document to recent documents
  const addRecentDocument = useCallback((document: Document, appName: string) => {
    setRecentDocuments((prev) => {
      // Remove if already exists
      const filtered = prev.filter((doc) => doc.id !== document.id);
      
      // Add to beginning with timestamp
      const updated: RecentDocument[] = [
        {
          ...document,
          appName,
          viewedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_RECENT_DOCUMENTS);

      // Save to localStorage
      try {
        localStorage.setItem(RECENT_DOCUMENTS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving recent documents:", error);
      }

      return updated;
    });
  }, []);

  // Clear recent documents
  const clearRecentDocuments = useCallback(() => {
    setRecentDocuments([]);
    try {
      localStorage.removeItem(RECENT_DOCUMENTS_KEY);
    } catch (error) {
      console.error("Error clearing recent documents:", error);
    }
  }, []);

  return {
    recentDocuments,
    addRecentDocument,
    clearRecentDocuments,
  };
}
