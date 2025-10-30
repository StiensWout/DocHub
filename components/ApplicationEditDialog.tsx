"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { updateApplication, getApplicationGroups } from "@/lib/supabase/queries";
import { useToast } from "./Toast";
import IconPicker from "./IconPicker";
import ColorPicker from "./ColorPicker";
import type { ApplicationGroup, Application } from "@/types";

interface ApplicationEditDialogProps {
  isOpen: boolean;
  application: Application | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  icon?: string;
  color?: string;
}

export default function ApplicationEditDialog({
  isOpen,
  application,
  onClose,
  onSuccess,
}: ApplicationEditDialogProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Globe");
  const [color, setColor] = useState("blue-500");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<ApplicationGroup[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
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

  // Pre-populate form when application changes
  useEffect(() => {
    if (application && isOpen) {
      setName(application.name);
      setIcon(application.icon_name || "Globe");
      setColor(application.color || "blue-500");
      setGroupId(application.group_id || null);
      setHasChanges(false);
      setErrors({});
    }
  }, [application, isOpen]);

  // Detect changes
  useEffect(() => {
    if (!application) return;

    const changed =
      name !== application.name ||
      icon !== application.icon_name ||
      color !== application.color ||
      groupId !== (application.group_id || null);

    setHasChanges(changed);
  }, [name, icon, color, groupId, application]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setIcon("Globe");
      setColor("blue-500");
      setGroupId(null);
      setErrors({});
      setIsUpdating(false);
      setHasChanges(false);
      setShowConfirmClose(false);
    }
  }, [isOpen]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Application name is required";
    } else if (name.length > 100) {
      newErrors.name = "Application name must be 100 characters or less";
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      newErrors.name = "Name can only contain letters, numbers, spaces, hyphens, and underscores";
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
  }, [name, icon, color]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!application) return;

    const isValid = validateForm();
    if (!isValid) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsUpdating(true);

    try {
      const updates: {
        name?: string;
        icon_name?: string;
        color?: string;
        group_id?: string | null;
      } = {};

      // Only include changed fields
      if (name !== application.name) {
        updates.name = name.trim();
      }
      if (icon !== application.icon_name) {
        updates.icon_name = icon;
      }
      if (color !== application.color) {
        updates.color = color;
      }
      if (groupId !== (application.group_id || null)) {
        updates.group_id = groupId;
      }

      // Check if there are any changes
      if (Object.keys(updates).length === 0) {
        toast.info("No changes to save");
        setIsUpdating(false);
        return;
      }

      const result = await updateApplication(application.id, updates);

      if (!result.success) {
        toast.error(result.error || "Failed to update application");
        setIsUpdating(false);
        return;
      }

      toast.success(`Application "${name}" updated successfully!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("An unexpected error occurred");
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay">
      <div
        className="fixed inset-0"
        onClick={handleClose}
      />
      
      {/* Confirmation Dialog */}
      {showConfirmClose && (
        <div className="relative z-10 bg-background-tertiary border border-border rounded-xl shadow-theme-xl p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-white mb-2">Discard Changes?</h3>
          <p className="text-foreground-secondary mb-6">
            You have unsaved changes. Are you sure you want to close without saving?
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleCancelClose}
              className="px-4 py-2 bg-glass hover:bg-glass-hover rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClose}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors"
            >
              Discard Changes
            </button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {!showConfirmClose && (
        <div className="relative bg-background-tertiary border border-border rounded-xl shadow-theme-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-bold text-white">Edit Application</h2>
              <p className="text-sm text-foreground-muted mt-1">ID: {application.id}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
              disabled={isUpdating}
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
                disabled={isUpdating}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error">{errors.name}</p>
              )}
            </div>

            {/* Application ID (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Application ID
              </label>
              <input
                type="text"
                value={application.id}
                disabled
                className="w-full px-4 py-2.5 bg-background/50 border border-border rounded-lg text-gray-400 font-mono text-sm cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-foreground-muted">
                Application ID cannot be changed
              </p>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Icon <span className="text-error">*</span>
              </label>
              <IconPicker
                selectedIcon={icon}
                onSelect={(iconName) => {
                  // Only update local state - does NOT save to database
                  // Save only happens when "Save Changes" button is clicked
                  setIcon(iconName);
                }}
                disabled={isUpdating}
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
                onSelect={(colorName) => {
                  // Only update local state - does NOT save to database
                  // Save only happens when "Save Changes" button is clicked
                  setColor(colorName);
                }}
                disabled={isUpdating}
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
                disabled={isUpdating}
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
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {hasChanges && (
                <p className="text-sm text-foreground-muted">
                  You have unsaved changes
                </p>
              )}
              {!hasChanges && <div />}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-glass hover:bg-glass-hover rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !hasChanges}
                  className="px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

