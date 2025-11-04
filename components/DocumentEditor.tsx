import { createClient } from "@supabase/supabase-js";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Save,
  X,
} from "lucide-react";
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import FileUploadButton from "./FileUploadButton";
import FileList from "./FileList";
import Breadcrumbs from "./Breadcrumbs";
import { useToast } from "./Toast";
import type { Document, BreadcrumbItem } from "@/types";

interface DocumentEditorProps {
  document: Document | null;
  appId: string;
  teamId: string;
  onSave: () => void;
  onClose: () => void;
  breadcrumbs?: BreadcrumbItem[];
}

export default function DocumentEditor({
  document,
  appId,
  teamId,
  onSave,
  onClose,
  breadcrumbs,
}: DocumentEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [filesKey, setFilesKey] = useState(0); // Force re-render of FileList
  const toast = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-400 hover:text-blue-300 underline",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your document...",
      }),
    ],
    content: document?.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[400px] p-6",
      },
    },
  });

  const handleImageUpload = useCallback(async () => {
    if (typeof window === "undefined" || typeof window.document === "undefined") return;
    const input = window.document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;

      setIsUploadingImage(true);
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `documents/${appId}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast.error("Failed to upload image");
          return;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(filePath);

        // Insert image into editor
        editor.chain().focus().setImage({ src: publicUrl }).run();
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to upload image");
      } finally {
        setIsUploadingImage(false);
      }
    };
  }, [editor, appId, toast]);

  const handleSave = async () => {
    if (!editor || !document) return;

    setIsSaving(true);
    try {
      const content = editor.getHTML();
      const tableName = document.type === "base" ? "base_documents" : "team_documents";
      const idField = document.type === "base" ? "id" : "id";

      const updateData: any = {
        content,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq(idField, document.id);

      if (error) {
        console.error("Error saving document:", error);
        toast.error("Failed to save document");
        return;
      }

      toast.success("Document saved successfully!");
      // Wait for onSave to complete before closing to ensure DocumentViewer receives updated content
      await onSave();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return <div className="text-gray-400">Loading editor...</div>;
  }

  return (
    <div className="w-full animate-[fadeIn_0.3s_ease-in-out]">
      <div className="bg-background-tertiary border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Header with Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="px-6 pt-4 pb-2 border-b border-border">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-glass sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-glass-hover ${
                editor.isActive("bold") ? "bg-glass-hover" : ""
              }`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-glass-hover ${
                editor.isActive("italic") ? "bg-glass-hover" : ""
              }`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-glass-hover ${
                editor.isActive("bulletList") ? "bg-glass-hover" : ""
              }`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-glass-hover ${
                editor.isActive("orderedList") ? "bg-glass-hover" : ""
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const url = window.prompt("Enter URL:");
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className={`p-2 rounded hover:bg-glass-hover ${
                editor.isActive("link") ? "bg-glass-hover" : ""
              }`}
              title="Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleImageUpload}
              disabled={isUploadingImage}
              className="p-2 rounded hover:bg-glass-hover disabled:opacity-50"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {document && (
              <FileUploadButton
                documentId={document.id}
                documentType={document.type}
                teamId={teamId}
                applicationId={appId}
                onUploadSuccess={() => {
                  setFilesKey((prev) => prev + 1); // Refresh file list
                }}
              />
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
              aria-label="Close editor"
            >
              <X className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 bg-background flex flex-col">
          <div className="flex-1 p-4">
            <EditorContent editor={editor} />
          </div>
          
          {/* File List */}
          {document && (
            <div className="border-t border-border p-4 bg-background-secondary">
              <FileList
                key={filesKey}
                documentId={document.id}
                documentType={document.type}
                applicationId={appId}
                teamId={teamId}
                onFileDeleted={() => {
                  setFilesKey((prev) => prev + 1); // Refresh file list
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
