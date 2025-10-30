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

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[len2][len1];
}

// Calculate fuzzy match score (0-1, higher is better)
function fuzzyMatchScore(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match
  if (textLower === queryLower) return 1.0;

  // Contains match
  if (textLower.includes(queryLower)) return 0.9;

  // Starts with match
  if (textLower.startsWith(queryLower)) return 0.85;

  // Calculate similarity using Levenshtein distance
  const distance = levenshteinDistance(queryLower, textLower);
  const maxLength = Math.max(queryLower.length, textLower.length);
  const similarity = 1 - distance / maxLength;

  // Boost score if similarity is high enough (typo tolerance)
  if (similarity >= 0.7) {
    return similarity * 0.8; // Slightly lower than exact/contains matches
  }

  // Check if query characters appear in order (subsequence match)
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  if (queryIndex === queryLower.length) {
    return 0.6; // Characters appear in order
  }

  return similarity;
}

// Search documents across all applications
export async function searchDocuments(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim().toLowerCase();
  const results: SearchResult[] = [];
  const fuzzyResults: SearchResult[] = [];

  // Search base documents
  if (!filters.documentType || filters.documentType === "all" || filters.documentType === "base") {
    let baseQuery = supabase
      .from("base_documents")
      .select("*, applications!inner(name, id)");

    // More lenient search: match if query is substring OR if first 3+ chars match (for typos)
    if (searchTerm.length >= 3) {
      const firstChars = searchTerm.substring(0, 3);
      baseQuery = baseQuery.or(
        `title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,title.ilike.%${firstChars}%,category.ilike.%${firstChars}%`
      );
    } else {
      baseQuery = baseQuery.or(
        `title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
      );
    }

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
        const titleFuzzy = fuzzyMatchScore(doc.title, searchTerm);
        const categoryFuzzy = fuzzyMatchScore(doc.category, searchTerm);
        const fuzzyScore = Math.max(titleFuzzy, categoryFuzzy);
        
        const result: SearchResult = {
          id: doc.id,
          title: doc.title,
          category: doc.category,
          type: "base" as const,
          content: doc.content || undefined,
          updated: formatTimeAgo(doc.updated_at),
          appId: doc.application_id,
          appName: doc.applications?.name || "",
          relevanceScore: relevance + (fuzzyScore * 50), // Boost relevance with fuzzy score
        };

        if (relevance > 0 || fuzzyScore >= 0.7) {
          results.push(result);
        } else if (fuzzyScore >= 0.5) {
          fuzzyResults.push(result);
        }
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

    // More lenient search: match if query is substring OR if first 3+ chars match (for typos)
    if (searchTerm.length >= 3) {
      const firstChars = searchTerm.substring(0, 3);
      teamQuery = teamQuery.or(
        `title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,title.ilike.%${firstChars}%,category.ilike.%${firstChars}%`
      );
    } else {
      teamQuery = teamQuery.or(
        `title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
      );
    }

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
        const titleFuzzy = fuzzyMatchScore(doc.title, searchTerm);
        const categoryFuzzy = fuzzyMatchScore(doc.category, searchTerm);
        const fuzzyScore = Math.max(titleFuzzy, categoryFuzzy);
        
        const result: SearchResult = {
          id: doc.id,
          title: doc.title,
          category: doc.category,
          type: "team" as const,
          content: doc.content || undefined,
          updated: formatTimeAgo(doc.updated_at),
          appId: doc.application_id,
          appName: doc.applications?.name || "",
          relevanceScore: relevance + (fuzzyScore * 50), // Boost relevance with fuzzy score
        };

        if (relevance > 0 || fuzzyScore >= 0.7) {
          results.push(result);
        } else if (fuzzyScore >= 0.5) {
          fuzzyResults.push(result);
        }
      });
    }
  }

  // Add fuzzy results if no exact matches or few results
  if (results.length < 5 && fuzzyResults.length > 0) {
    // Add fuzzy results, avoiding duplicates
    const existingIds = new Set(results.map(r => r.id));
    fuzzyResults.forEach(result => {
      if (!existingIds.has(result.id)) {
        results.push(result);
      }
    });
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

// Get document titles for search suggestions
export async function getDocumentTitles(query: string, filters: SearchFilters = {}): Promise<string[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim().toLowerCase();
  const titlesSet = new Set<string>();

  // Get titles from base documents
  if (!filters.documentType || filters.documentType === "all" || filters.documentType === "base") {
    let baseQuery = supabase
      .from("base_documents")
      .select("title")
      .ilike("title", `%${searchTerm}%`)
      .limit(10);

    if (filters.applicationId) {
      baseQuery = baseQuery.eq("application_id", filters.applicationId);
    }

    const { data: baseDocs } = await baseQuery;
    if (baseDocs) {
      baseDocs.forEach((doc) => {
        if (doc.title.toLowerCase().includes(searchTerm)) {
          titlesSet.add(doc.title);
        }
      });
    }
  }

  // Get titles from team documents
  if (
    (!filters.documentType || filters.documentType === "all" || filters.documentType === "team") &&
    filters.teamId
  ) {
    let teamQuery = supabase
      .from("team_documents")
      .select("title")
      .eq("team_id", filters.teamId)
      .ilike("title", `%${searchTerm}%`)
      .limit(10);

    if (filters.applicationId) {
      teamQuery = teamQuery.eq("application_id", filters.applicationId);
    }

    const { data: teamDocs } = await teamQuery;
    if (teamDocs) {
      teamDocs.forEach((doc) => {
        if (doc.title.toLowerCase().includes(searchTerm)) {
          titlesSet.add(doc.title);
        }
      });
    }
  }

  return Array.from(titlesSet).slice(0, 8);
}

// Get category suggestions for search
export async function getCategorySuggestions(query: string, teamId?: string): Promise<string[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim().toLowerCase();
  const categories = await getCategories(teamId);
  
  return categories
    .filter((cat) => cat.toLowerCase().includes(searchTerm))
    .slice(0, 5);
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
