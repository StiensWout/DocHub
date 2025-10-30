import { LucideIcon } from "lucide-react";

export type DocumentType = "base" | "team";

export interface Document {
  id: string;
  title: string;
  category: string;
  type: DocumentType;
  content?: string;
  updated: string;
  appId: string;
}

export interface Application {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  baseDocuments: Document[];
}

export interface TeamDocument {
  document: Document;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  documents: TeamDocument[];
}

export interface ApplicationWithDocs extends Application {
  teamDocuments: Document[];
  totalDocuments: number;
  lastUpdated: string;
}
