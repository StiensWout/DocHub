import { supabase } from "@/lib/supabase/client";
import { Globe, Database, Zap, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Document, Application, Team } from "@/types";

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

  // Map icon names to actual icon components
  const iconMap: Record<string, LucideIcon> = {
    Globe,
    Database,
    Zap,
    Settings,
  };

  return (data || []).map((app: DatabaseApplication) => ({
    id: app.id,
    name: app.name,
    icon: iconMap[app.icon_name] || Globe,
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
