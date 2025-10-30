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

export interface DocumentFile {
  id: string;
  document_id: string | null;
  document_type: DocumentType | null;
  application_id: string | null;
  team_id: string | null;
  file_name: string;
  file_path: string;
  file_type: string; // MIME type
  file_size: number; // bytes
  storage_bucket: string;
  visibility: 'public' | 'team'; // public = all teams, team = specific team
  uploaded_by?: string | null;
  uploaded_at: string;
  updated_at: string;
}

export interface FileUploadParams {
  documentId?: string;
  documentType?: DocumentType;
  applicationId?: string;
  teamId?: string;
  file: File;
  visibility?: 'public' | 'team';
}