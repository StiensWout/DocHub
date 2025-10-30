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
import type { Document } from "@/types";

interface DocumentEditorProps {
  document: Document | null;
  appId: string;
  teamId: string;
  onSave: () => void;
  onClose: () => void;
}

export default function DocumentEditor({
  document,
  appId,
  teamId,
  onSave,
  onClose,
}: DocumentEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [filesKey, setFilesKey] = useState(0); // Force re-render of FileList

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
    const input = document.createElement("input");
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
          alert("Failed to upload image");
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
  }, [editor, appId]);

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
        alert("Failed to save document");
        return;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return <div className="text-gray-400">Loading editor...</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-white/10 ${
                editor.isActive("bold") ? "bg-white/10" : ""
              }`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-white/10 ${
                editor.isActive("italic") ? "bg-white/10" : ""
              }`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-white/10 ${
                editor.isActive("bulletList") ? "bg-white/10" : ""
              }`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-white/10 ${
                editor.isActive("orderedList") ? "bg-white/10" : ""
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
              className={`p-2 rounded hover:bg-white/10 ${
                editor.isActive("link") ? "bg-white/10" : ""
              }`}
              title="Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleImageUpload}
              disabled={isUploadingImage}
              className="p-2 rounded hover:bg-white/10 disabled:opacity-50"
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
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] flex flex-col">
          <div className="flex-1 p-4">
            <EditorContent editor={editor} />
          </div>
          
              {/* File List */}
              {document && (
                <div className="border-t border-white/10 p-4 bg-[#0f0f0f]">
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
