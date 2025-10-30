import { supabase } from "@/lib/supabase/client";
import type { Document } from "@/types";

export interface SearchResult extends Document {
  appName: string;
  appId: string;
  relevanceScore?: number;
}

export interface SearchFilters {
  teamId?: string;
  applicationId?: string;
  category?: string;
  documentType?: "base" | "team" | "all";
}

// Search documents across all applications
export async function searchDocuments(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  // Search base documents
  if (!filters.documentType || filters.documentType === "all" || filters.documentType === "base") {
    let baseQuery = supabase
      .from("base_documents")
      .select("*, applications!inner(name, id)");

    // Apply search filter - PostgREST syntax
    baseQuery = baseQuery.or(
      `title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
    );

    if (filters.applicationId) {
      baseQuery = baseQuery.eq("application_id", filters.applicationId);
    }

    if (filters.category) {
      baseQuery = baseQuery.eq("category", filters.category);
    }

    const { data: baseDocs, error: baseError } = await baseQuery;

    if (!baseError && baseDocs) {
      baseDocs.forEach((doc: any) => {
        const relevance = calculateRelevance(doc, searchTerm);
        results.push({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          type: "base" as const,
          content: doc.content || undefined,
          updated: formatTimeAgo(doc.updated_at),
          appId: doc.application_id,
          appName: doc.applications?.name || "",
          relevanceScore: relevance,
        });
      });
    }
  }

  // Search team documents
  if (
    (!filters.documentType || filters.documentType === "all" || filters.documentType === "team") &&
    filters.teamId
  ) {
    let teamQuery = supabase
      .from("team_documents")
      .select("*, applications!inner(name, id)")
      .eq("team_id", filters.teamId);

    // Apply search filter - PostgREST syntax
    teamQuery = teamQuery.or(
      `title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
    );

    if (filters.applicationId) {
      teamQuery = teamQuery.eq("application_id", filters.applicationId);
    }

    if (filters.category) {
      teamQuery = teamQuery.eq("category", filters.category);
    }

    const { data: teamDocs, error: teamError } = await teamQuery;

    if (!teamError && teamDocs) {
      teamDocs.forEach((doc: any) => {
        const relevance = calculateRelevance(doc, searchTerm);
        results.push({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          type: "team" as const,
          content: doc.content || undefined,
          updated: formatTimeAgo(doc.updated_at),
          appId: doc.application_id,
          appName: doc.applications?.name || "",
          relevanceScore: relevance,
        });
      });
    }
  }

  // Sort by relevance score
  results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  return results;
}

// Calculate relevance score based on match position
function calculateRelevance(doc: any, searchTerm: string): number {
  let score = 0;
  const titleLower = doc.title.toLowerCase();
  const categoryLower = doc.category.toLowerCase();
  const contentLower = (doc.content || "").toLowerCase();

  // Title matches are most relevant
  if (titleLower.includes(searchTerm)) {
    score += 100;
    if (titleLower.startsWith(searchTerm)) score += 50;
  }

  // Category matches
  if (categoryLower.includes(searchTerm)) {
    score += 30;
  }

  // Content matches
  if (contentLower.includes(searchTerm)) {
    score += 10;
    // Boost if match is near the beginning
    const contentIndex = contentLower.indexOf(searchTerm);
    if (contentIndex < 200) score += 5;
  }

  return score;
}

// Get all unique categories for filtering
export async function getCategories(teamId?: string): Promise<string[]> {
  const categoriesSet = new Set<string>();

  // Get categories from base documents
  const { data: baseDocs } = await supabase
    .from("base_documents")
    .select("category");

  if (baseDocs) {
    baseDocs.forEach((doc) => categoriesSet.add(doc.category));
  }

  // Get categories from team documents if teamId provided
  if (teamId) {
    const { data: teamDocs } = await supabase
      .from("team_documents")
      .select("category")
      .eq("team_id", teamId);

    if (teamDocs) {
      teamDocs.forEach((doc) => categoriesSet.add(doc.category));
    }
  }

  return Array.from(categoriesSet).sort();
}

// Helper function to format timestamp as "time ago"
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else {
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  }
}
