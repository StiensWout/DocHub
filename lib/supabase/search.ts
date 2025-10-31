import { supabase } from "@/lib/supabase/client";
import type { Document } from "@/types";
import { log } from "@/lib/logger";

export interface DocumentSearchResult extends Document {
  appName: string;
  appId: string;
  relevanceScore?: number;
}

export interface ApplicationSearchResult {
  type: 'application';
  id: string;
  name: string;
  icon_name: string;
  color: string;
  group_id?: string | null;
  document_count?: number;
}

export interface GroupSearchResult {
  type: 'group';
  id: string;
  name: string;
  icon_name?: string | null;
  color?: string | null;
  application_count: number;
}

export type SearchResult = DocumentSearchResult | ApplicationSearchResult | GroupSearchResult;

// Legacy type alias for backward compatibility
export interface SearchResultLegacy extends Document {
  appName: string;
  appId: string;
  relevanceScore?: number;
}

export interface SearchFilters {
  teamId?: string;
  applicationId?: string;
  category?: string;
  documentType?: "base" | "team" | "all";
  tagIds?: string[]; // Array of tag IDs to filter by
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
): Promise<DocumentSearchResult[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim().toLowerCase();
  const results: DocumentSearchResult[] = [];
  const fuzzyResults: DocumentSearchResult[] = [];

  // Get document IDs that match tag filters (if tags are specified)
  let baseDocIdsWithTags: string[] | null = null;
  let teamDocIdsWithTags: string[] | null = null;
  
  if (filters.tagIds && filters.tagIds.length > 0) {
    // For base documents
    if (!filters.documentType || filters.documentType === "all" || filters.documentType === "base") {
      const { data: baseTagDocs } = await supabase
        .from("document_tags")
        .select("document_id")
        .eq("document_type", "base")
        .in("tag_id", filters.tagIds);
      
      if (baseTagDocs) {
        // Group by document_id and count tags - documents must have ALL specified tags
        const docTagCounts = new Map<string, number>();
        baseTagDocs.forEach((dt: any) => {
          docTagCounts.set(dt.document_id, (docTagCounts.get(dt.document_id) || 0) + 1);
        });
        // Only include documents that have all the specified tags
        baseDocIdsWithTags = Array.from(docTagCounts.entries())
          .filter(([_, count]) => count === filters.tagIds!.length)
          .map(([docId]) => docId);
      }
    }
    
    // For team documents
    if ((!filters.documentType || filters.documentType === "all" || filters.documentType === "team") && filters.teamId) {
      const { data: teamTagDocs } = await supabase
        .from("document_tags")
        .select("document_id")
        .eq("document_type", "team")
        .in("tag_id", filters.tagIds);
      
      if (teamTagDocs) {
        const docTagCounts = new Map<string, number>();
        teamTagDocs.forEach((dt: any) => {
          docTagCounts.set(dt.document_id, (docTagCounts.get(dt.document_id) || 0) + 1);
        });
        teamDocIdsWithTags = Array.from(docTagCounts.entries())
          .filter(([_, count]) => count === filters.tagIds!.length)
          .map(([docId]) => docId);
      }
    }
  }

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

    // Filter by tag IDs if specified
    if (baseDocIdsWithTags !== null) {
      if (baseDocIdsWithTags.length === 0) {
        // No documents match the tag filter, skip processing
        baseQuery = baseQuery.eq("id", "00000000-0000-0000-0000-000000000000"); // Will return no results
      } else {
        baseQuery = baseQuery.in("id", baseDocIdsWithTags);
      }
    }

    const { data: baseDocs, error: baseError } = await baseQuery;

    if (!baseError && baseDocs) {
      baseDocs.forEach((doc: any) => {
        const relevance = calculateRelevance(doc, searchTerm);
        const titleFuzzy = fuzzyMatchScore(doc.title, searchTerm);
        const categoryFuzzy = fuzzyMatchScore(doc.category, searchTerm);
        const fuzzyScore = Math.max(titleFuzzy, categoryFuzzy);
        
        const result: DocumentSearchResult = {
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

    // Filter by tag IDs if specified
    if (teamDocIdsWithTags !== null) {
      if (teamDocIdsWithTags.length === 0) {
        // No documents match the tag filter, skip processing
        teamQuery = teamQuery.eq("id", "00000000-0000-0000-0000-000000000000"); // Will return no results
      } else {
        teamQuery = teamQuery.in("id", teamDocIdsWithTags);
      }
    }

    const { data: teamDocs, error: teamError } = await teamQuery;

    if (!teamError && teamDocs) {
      teamDocs.forEach((doc: any) => {
        const relevance = calculateRelevance(doc, searchTerm);
        const titleFuzzy = fuzzyMatchScore(doc.title, searchTerm);
        const categoryFuzzy = fuzzyMatchScore(doc.category, searchTerm);
        const fuzzyScore = Math.max(titleFuzzy, categoryFuzzy);
        
        const result: DocumentSearchResult = {
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

// Search applications by name
export async function searchApplications(query: string): Promise<ApplicationSearchResult[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim().toLowerCase();
  
  // Search for applications matching the query (case-insensitive)
  const { data, error } = await supabase
    .from("applications")
    .select("id, name, icon_name, color, group_id")
    .ilike("name", `%${searchTerm}%`)
    .order("name")
    .limit(10);

  if (error) {
    log.error("Error searching applications:", error);
    return [];
  }

  if (!data) return [];

  // Get document counts for each application
  const appsWithCounts = await Promise.all(
    data.map(async (app) => {
      // Count base documents
      const { count: baseCount } = await supabase
        .from("base_documents")
        .select("id", { count: "exact", head: true })
        .eq("application_id", app.id);

      // Count team documents (across all teams)
      const { count: teamCount } = await supabase
        .from("team_documents")
        .select("id", { count: "exact", head: true })
        .eq("application_id", app.id);

      const documentCount = (baseCount || 0) + (teamCount || 0);

      return {
        type: 'application' as const,
        id: app.id,
        name: app.name,
        icon_name: app.icon_name,
        color: app.color,
        group_id: app.group_id,
        document_count: documentCount,
      };
    })
  );

  // Sort by relevance: exact match first, then starts with, then contains
  return appsWithCounts.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    if (aName === searchTerm && bName !== searchTerm) return -1;
    if (aName !== searchTerm && bName === searchTerm) return 1;
    if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
    if (!aName.startsWith(searchTerm) && bName.startsWith(searchTerm)) return 1;
    
    return a.name.localeCompare(b.name);
  });
}

// Search application groups by name
export async function searchApplicationGroups(query: string): Promise<GroupSearchResult[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim().toLowerCase();
  
  // Search for groups matching the query (case-insensitive)
  const { data, error } = await supabase
    .from("application_groups")
    .select("id, name, icon_name, color")
    .ilike("name", `%${searchTerm}%`)
    .order("display_order")
    .order("name")
    .limit(10);

  if (error) {
    log.error("Error searching application groups:", error);
    return [];
  }

  if (!data) return [];

  // Get application counts for each group
  const groupsWithCounts = await Promise.all(
    data.map(async (group) => {
      const { count } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("group_id", group.id);

      return {
        type: 'group' as const,
        id: group.id,
        name: group.name,
        icon_name: group.icon_name,
        color: group.color,
        application_count: count || 0,
      };
    })
  );

  // Sort by relevance: exact match first, then starts with, then contains
  // Also filter out groups with 0 applications
  return groupsWithCounts
    .filter(group => group.application_count > 0)
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      if (aName === searchTerm && bName !== searchTerm) return -1;
      if (aName !== searchTerm && bName === searchTerm) return 1;
      if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
      if (!aName.startsWith(searchTerm) && bName.startsWith(searchTerm)) return 1;
      
      return a.name.localeCompare(b.name);
    });
}

// Get application suggestions for autocomplete
export async function getApplicationSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim().toLowerCase();
  
  const { data } = await supabase
    .from("applications")
    .select("name")
    .ilike("name", `%${searchTerm}%`)
    .order("name")
    .limit(3);

  return (data || []).map(app => app.name);
}

// Get group suggestions for autocomplete
export async function getGroupSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  const searchTerm = query.trim().toLowerCase();
  
  const { data } = await supabase
    .from("application_groups")
    .select("name")
    .ilike("name", `%${searchTerm}%`)
    .order("name")
    .limit(2);

  return (data || []).map(group => group.name);
}
