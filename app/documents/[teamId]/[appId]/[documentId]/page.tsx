"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DocumentViewer from "@/components/DocumentViewer";
import { getDocumentById } from "@/lib/supabase/queries";
import type { Document } from "@/types";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SharedDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const appId = params.appId as string;
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [appName, setAppName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocument() {
      if (!documentId) {
        setError("Document ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching document:", { documentId, teamId, appId });
        const result = await getDocumentById(documentId, teamId, appId);
        console.log("Document fetch result:", result);

        if (!result) {
          setError("Document not found");
          setLoading(false);
          return;
        }

        setDocument(result.document);
        setAppName(result.appName);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document");
        setLoading(false);
      }
    }

    fetchDocument();
  }, [documentId, teamId, appId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-foreground-secondary">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Document Not Found</h1>
          <p className="text-foreground-secondary mb-6">{error || "The document you're looking for doesn't exist or has been removed."}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <DocumentViewer
          document={document}
          appName={appName || "Unknown"}
          appId={document.appId}
          teamId={teamId || ""}
          onClose={() => router.push("/")}
          breadcrumbs={[
            {
              label: "Home",
              onClick: () => router.push("/"),
            },
            {
              label: appName || "Document",
            },
          ]}
        />
      </div>
    </div>
  );
}

