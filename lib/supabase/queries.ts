import { supabase } from "@/lib/supabase/client";
import { Globe, Database, Zap, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Document, Application, Team, DocumentFile } from "@/types";
import * as LucideIcons from "lucide-react";

export interface DatabaseApplication {
  id: string;
  name: string;
  icon_name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTeam {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBaseDocument {
  id: string;
  application_id: string;
  title: string;
  category: string;
  content: string | null;
  updated_at: string;
  created_at: string;
}

export interface DatabaseTeamDocument {
  id: string;
  team_id: string;
  application_id: string;
  title: string;
  category: string;
  content: string | null;
  updated_at: string;
  created_at: string;
}

// Fetch all teams
export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching teams:", error);
    return [];
  }

  return (data || []).map((team: DatabaseTeam) => ({
    id: team.id,
    name: team.name,
    documents: [], // Will be populated separately
  }));
}

// Create a new application
export async function createApplication(
  id: string,
  name: string,
  iconName: string,
  color: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("applications")
    .insert({
      id,
      name,
      icon_name: iconName,
      color,
    });

  if (error) {
    console.error("Error creating application:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Update an existing application
export async function updateApplication(
  id: string,
  updates: {
    name?: string;
    icon_name?: string;
    color?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Error updating application:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Check if application ID already exists
export async function checkApplicationIdExists(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("applications")
    .select("id")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
    console.error("Error checking application ID:", error);
    return false;
  }

  return !!data;
}

// Fetch all applications
export async function getApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching applications:", error);
    return [];
  }

  // Map icon names to actual icon components dynamically
  const getIconComponent = (iconName: string): LucideIcon => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon;
    return Icon || Globe; // Fallback to Globe if icon not found
  };

  return (data || []).map((app: DatabaseApplication) => ({
    id: app.id,
    name: app.name,
    icon: getIconComponent(app.icon_name),
    color: app.color,
    baseDocuments: [], // Will be populated separately
  }));
}

// Fetch base documents for an application
export async function getBaseDocuments(appId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from("base_documents")
    .select("*")
    .eq("application_id", appId)
    .order("created_at");

  if (error) {
    console.error("Error fetching base documents:", error);
    return [];
  }

  return (data || []).map((doc: DatabaseBaseDocument) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    type: "base" as const,
    content: doc.content || undefined,
    updated: formatTimeAgo(doc.updated_at),
    appId: doc.application_id,
  }));
}

// Fetch team documents for a team and application
export async function getTeamDocuments(
  teamId: string,
  appId: string
): Promise<Document[]> {
  const { data, error } = await supabase
    .from("team_documents")
    .select("*")
    .eq("team_id", teamId)
    .eq("application_id", appId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching team documents:", error);
    return [];
  }

  return (data || []).map((doc: DatabaseTeamDocument) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    type: "team" as const,
    content: doc.content || undefined,
    updated: formatTimeAgo(doc.updated_at),
    appId: doc.application_id,
  }));
}

// Fetch all documents for an application (base + team)
export async function getAllDocumentsForApp(
  teamId: string,
  appId: string
): Promise<Document[]> {
  const [baseDocs, teamDocs] = await Promise.all([
    getBaseDocuments(appId),
    getTeamDocuments(teamId, appId),
  ]);

  return [...baseDocs, ...teamDocs];
}

// Get a single document by ID (checks both base and team documents)
// Returns document and application name
export async function getDocumentById(
  documentId: string,
  teamId?: string,
  appId?: string
): Promise<{ document: Document; appName: string } | null> {
  console.log("getDocumentById called with:", { documentId, teamId, appId });
  
  // Try base documents first
  const { data: baseDoc, error: baseError } = await supabase
    .from("base_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  console.log("Base document query:", { baseDoc, baseError });

  if (!baseError && baseDoc) {
    // Verify appId matches if provided
    if (appId && baseDoc.application_id !== appId) {
      console.log("Base doc appId mismatch, checking team documents");
      // If appId doesn't match, continue to check team documents
    } else {
      // Base document found - return it (ignore teamId for base documents)
      const { data: app } = await supabase
        .from("applications")
        .select("name")
        .eq("id", baseDoc.application_id)
        .single();

      console.log("Returning base document:", { document: baseDoc, appName: app?.name });

      return {
        document: {
          id: baseDoc.id,
          title: baseDoc.title,
          category: baseDoc.category,
          type: "base" as const,
          content: baseDoc.content || undefined,
          updated: formatTimeAgo(baseDoc.updated_at),
          appId: baseDoc.application_id,
        },
        appName: app?.name || "Unknown",
      };
    }
  }

  // Try team documents
  const { data: teamDoc, error: teamError } = await supabase
    .from("team_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  console.log("Team document query:", { teamDoc, teamError });

  if (!teamError && teamDoc) {
    // Verify teamId and appId match if provided
    // Allow "base" teamId to pass through (for compatibility with share URLs)
    if (teamId && teamId !== "base" && teamDoc.team_id !== teamId) {
      console.log("Team doc teamId mismatch:", { providedTeamId: teamId, docTeamId: teamDoc.team_id });
      return null;
    }
    if (appId && teamDoc.application_id !== appId) {
      console.log("Team doc appId mismatch:", { providedAppId: appId, docAppId: teamDoc.application_id });
      return null;
    }

    // Get application name
    const { data: app } = await supabase
      .from("applications")
      .select("name")
      .eq("id", teamDoc.application_id)
      .single();

    console.log("Returning team document:", { document: teamDoc, appName: app?.name });

    return {
      document: {
        id: teamDoc.id,
        title: teamDoc.title,
        category: teamDoc.category,
        type: "team" as const,
        content: teamDoc.content || undefined,
        updated: formatTimeAgo(teamDoc.updated_at),
        appId: teamDoc.application_id,
      },
      appName: app?.name || "Unknown",
    };
  }

  console.log("No document found");
  return null;
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

// ============================================================================
// FILE OPERATIONS
// ============================================================================

// Fetch all files for a document
export async function getDocumentFiles(
  documentId: string,
  documentType: "base" | "team"
): Promise<DocumentFile[]> {
  const { data, error } = await supabase
    .from("document_files")
    .select("*")
    .eq("document_id", documentId)
    .eq("document_type", documentType)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Error fetching document files:", error);
    return [];
  }

  return (data || []) as DocumentFile[];
}

// Fetch all files for an application (with visibility filtering)
export async function getApplicationFiles(
  applicationId: string,
  teamId?: string | null
): Promise<DocumentFile[]> {
  const { data, error } = await supabase
    .from("document_files")
    .select("*")
    .eq("application_id", applicationId)
    .is("document_id", null) // Only application-level files
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Error fetching application files:", error);
    return [];
  }

  // Filter by visibility client-side (Supabase PostgREST doesn't support complex OR conditions easily)
  let filteredData = data || [];
  
  if (teamId) {
    // Show public files OR team-specific files for this team
    filteredData = filteredData.filter(
      (file: any) => 
        file.visibility === 'public' || 
        (file.visibility === 'team' && file.team_id === teamId)
    );
  } else {
    // Show only public files
    filteredData = filteredData.filter((file: any) => file.visibility === 'public');
  }

  return filteredData as DocumentFile[];
}

// Fetch all files (document + application level) for a document and its application
export async function getAllFilesForDocument(
  documentId: string,
  documentType: "base" | "team",
  applicationId: string,
  teamId?: string | null
): Promise<DocumentFile[]> {
  // Get document files
  const docFiles = await getDocumentFiles(documentId, documentType);
  
  // Get application files
  const appFiles = await getApplicationFiles(applicationId, teamId);
  
  return [...docFiles, ...appFiles];
}

// Insert file metadata into database
export async function insertFileMetadata(
  fileData: Omit<DocumentFile, "id" | "uploaded_at" | "updated_at">
): Promise<DocumentFile | null> {
  const { data, error } = await supabase
    .from("document_files")
    .insert(fileData)
    .select()
    .single();

  if (error) {
    console.error("Error inserting file metadata:", error);
    return null;
  }

  return data as DocumentFile;
}

// Delete file metadata from database
export async function deleteFileMetadata(fileId: string): Promise<boolean> {
  const { error } = await supabase
    .from("document_files")
    .delete()
    .eq("id", fileId);

  if (error) {
    console.error("Error deleting file metadata:", error);
    return false;
  }

  return true;
}

// Get file metadata by ID
export async function getFileMetadata(fileId: string): Promise<DocumentFile | null> {
  const { data, error } = await supabase
    .from("document_files")
    .select("*")
    .eq("id", fileId)
    .single();

  if (error) {
    console.error("Error fetching file metadata:", error);
    return null;
  }

  return data as DocumentFile;
}
