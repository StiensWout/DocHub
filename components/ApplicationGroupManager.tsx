"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, Edit2, Trash2, Layers } from "lucide-react";
import {
  getApplicationGroups,
  createApplicationGroup,
  updateApplicationGroup,
  deleteApplicationGroup,
} from "@/lib/supabase/queries";
import { useToast } from "./Toast";
import IconPicker from "./IconPicker";
import ColorPicker from "./ColorPicker";
import type { ApplicationGroup } from "@/types";

interface ApplicationGroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: () => void;
}

interface GroupFormData {
  name: string;
  icon_name: string;
  color: string;
}

export default function ApplicationGroupManager({
  isOpen,
  onClose,
  onGroupCreated,
}: ApplicationGroupManagerProps) {
  const [groups, setGroups] = useState<ApplicationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ApplicationGroup | null>(null);
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    icon_name: "Layers",
    color: "gray-500",
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const groupsData = await getApplicationGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast.error("Failed to load application groups");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen, loadGroups]);

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsSaving(true);
    try {
      const result = await createApplicationGroup(
        formData.name,
        formData.icon_name,
        formData.color
      );

      if (result.success) {
        toast.success("Application group created successfully!");
        setFormData({ name: "", icon_name: "Layers", color: "gray-500" });
        setShowCreateForm(false);
        await loadGroups();
        onGroupCreated?.();
      } else {
        toast.error(result.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create application group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsSaving(true);
    try {
      console.log("[ApplicationGroupManager] Starting update", {
        groupId: editingGroup.id,
        updates: formData,
      });

      const result = await updateApplicationGroup(editingGroup.id, {
        name: formData.name,
        icon_name: formData.icon_name,
        color: formData.color,
      });

      console.log("[ApplicationGroupManager] Update result", result);

      if (result.success && result.data) {
        // Verify we got updated data back
        console.log("[ApplicationGroupManager] Update verified, refreshing groups");
        toast.success("Application group updated successfully!");
        setEditingGroup(null);
        setFormData({ name: "", icon_name: "Layers", color: "gray-500" });
        
        // Refresh groups from database once (updateApplicationGroup already returns updated data)
        await loadGroups();
        
        onGroupCreated?.();
      } else {
        const errorMessage = result.error || "Failed to update group";
        console.error("[ApplicationGroupManager] Update failed:", errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("[ApplicationGroupManager] Error updating group:", error);
      toast.error("Failed to update application group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? Applications in this group will be ungrouped.")) {
      return;
    }

    try {
      const result = await deleteApplicationGroup(groupId);
      if (result.success) {
        toast.success("Application group deleted successfully!");
        await loadGroups();
        onGroupCreated?.();
      } else {
        toast.error(result.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete application group");
    }
  };

  const startEdit = (group: ApplicationGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      icon_name: group.icon_name || "Layers",
      color: group.color || "gray-500",
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setFormData({ name: "", icon_name: "Layers", color: "gray-500" });
    setShowCreateForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background-secondary border border-border rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-white">Manage Application Groups</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading groups...</div>
          ) : (
            <>
              {/* Groups List */}
              <div className="space-y-3 mb-6">
                {groups.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No application groups yet</p>
                    <p className="text-sm mt-2">Create your first group to organize applications</p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 bg-background-tertiary border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {group.icon && (
                          <div className={`p-2 rounded-lg ${group.color || "bg-gray-500"} border`}>
                            <group.icon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-white">{group.name}</h3>
                          <p className="text-xs text-gray-400">Order: {group.display_order}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(group)}
                          className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
                          title="Edit group"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
                          title="Delete group"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Create/Edit Form */}
              {(showCreateForm || editingGroup) && (
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingGroup ? "Edit Group" : "Create New Group"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Group Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Frontend Apps"
                        className="w-full px-4 py-2 bg-background-tertiary border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Icon</label>
                      <IconPicker
                        selectedIcon={formData.icon_name}
                        onSelect={(iconName) => setFormData({ ...formData, icon_name: iconName })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
                      <ColorPicker
                        selectedColor={formData.color}
                        onSelect={(color) => setFormData({ ...formData, color })}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                        disabled={isSaving || !formData.name.trim()}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500 rounded-lg text-sm transition-all flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : editingGroup ? (
                          "Update Group"
                        ) : (
                          "Create Group"
                        )}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Button */}
              {!showCreateForm && !editingGroup && (
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingGroup(null);
                    setFormData({ name: "", icon_name: "Layers", color: "gray-500" });
                  }}
                  className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 border border-blue-500 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Group
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

