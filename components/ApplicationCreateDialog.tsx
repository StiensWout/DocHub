"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { createApplication, checkApplicationIdExists, getApplicationGroups } from "@/lib/supabase/queries";
import { useToast } from "./Toast";
import IconPicker from "./IconPicker";
import ColorPicker from "./ColorPicker";
import type { ApplicationGroup } from "@/types";

interface ApplicationCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  id?: string;
  icon?: string;
  color?: string;
}

// Helper function to slugify a string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export default function ApplicationCreateDialog({
  isOpen,
  onClose,
  onSuccess,
}: ApplicationCreateDialogProps) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [icon, setIcon] = useState("Globe");
  const [color, setColor] = useState("blue-500");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<ApplicationGroup[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCheckingId, setIsCheckingId] = useState(false);
  const toast = useToast();

  // Load groups when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    try {
      const groupsData = await getApplicationGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  // Auto-generate ID from name when name changes
  useEffect(() => {
    if (name.trim() && !isCheckingId) {
      const generatedId = slugify(name);
      setId(generatedId);
    }
  }, [name, isCheckingId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setId("");
      setIcon("Globe");
      setColor("blue-500");
      setGroupId(null);
      setErrors({});
      setIsCreating(false);
    }
  }, [isOpen]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Application name is required";
    } else if (name.length > 100) {
      newErrors.name = "Application name must be 100 characters or less";
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      newErrors.name = "Name can only contain letters, numbers, spaces, hyphens, and underscores";
    }

    // Validate ID
    if (!id.trim()) {
      newErrors.id = "Application ID is required";
    } else if (!/^[a-z0-9\-_]+$/.test(id)) {
      newErrors.id = "ID must be lowercase, alphanumeric, with hyphens and underscores only";
    } else {
      // Check if ID already exists
      setIsCheckingId(true);
      const exists = await checkApplicationIdExists(id);
      setIsCheckingId(false);
      if (exists) {
        newErrors.id = "This application ID already exists";
      }
    }

    // Validate icon
    if (!icon) {
      newErrors.icon = "Please select an icon";
    }

    // Validate color
    if (!color) {
      newErrors.color = "Please select a color";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, id, icon, color]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsCreating(true);

    try {
      const result = await createApplication(id, name.trim(), icon, color, groupId);

      if (!result.success) {
        toast.error(result.error || "Failed to create application");
        setIsCreating(false);
        return;
      }

      toast.success(`Application "${name}" created successfully!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating application:", error);
      toast.error("An unexpected error occurred");
      setIsCreating(false);
    }
  };

  const handleIdChange = (value: string) => {
    setId(value);
    setIsCheckingId(true);
    // Clear ID error when user starts typing
    if (errors.id) {
      setErrors((prev) => ({ ...prev, id: undefined }));
    }
  };

  // Clear checking state after a delay
  useEffect(() => {
    if (isCheckingId) {
      const timer = setTimeout(() => setIsCheckingId(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isCheckingId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative bg-background-tertiary border border-border rounded-xl shadow-theme-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-white">Create New Application</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
            disabled={isCreating}
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Application Name */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Application Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Portal"
              className={`w-full px-4 py-2.5 bg-background border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${
                errors.name ? "border-error" : "border-border"
              }`}
              disabled={isCreating}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-error">{errors.name}</p>
            )}
          </div>

          {/* Application ID */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Application ID <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="e.g., customer-portal"
                className={`w-full px-4 py-2.5 bg-background border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono text-sm ${
                  errors.id ? "border-error" : "border-border"
                }`}
                disabled={isCreating || isCheckingId}
              />
              {isCheckingId && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-foreground-muted">
              Auto-generated from name. Must be unique and lowercase.
            </p>
            {errors.id && (
              <p className="mt-1 text-sm text-error">{errors.id}</p>
            )}
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Icon <span className="text-error">*</span>
            </label>
            <IconPicker
              selectedIcon={icon}
              onSelect={setIcon}
            />
            {errors.icon && (
              <p className="mt-1 text-sm text-error">{errors.icon}</p>
            )}
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Color Theme <span className="text-error">*</span>
            </label>
            <ColorPicker
              selectedColor={color}
              onSelect={setColor}
            />
            {errors.color && (
              <p className="mt-1 text-sm text-error">{errors.color}</p>
            )}
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Application Group <span className="text-gray-500">(Optional)</span>
            </label>
            <select
              value={groupId || ""}
              onChange={(e) => setGroupId(e.target.value || null)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              disabled={isCreating}
            >
              <option value="">No Group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-foreground-muted">
              Assign this application to a group for better organization
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 bg-glass hover:bg-glass-hover rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || isCheckingId}
              className="px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

