"use client";

import { useState, useEffect } from "react";
import { X, Users, Shield, Save, Loader2 } from "lucide-react";

interface User {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  groups: string[];
}

interface UserGroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGroupManager({ isOpen, onClose }: UserGroupManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userGroups, setUserGroups] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/all');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load users');
      }

      setUsers(data.users || []);
      
      // Extract unique groups from all users
      const allGroups = new Set<string>();
      (data.users || []).forEach((user: User) => {
        user.groups.forEach(group => allGroups.add(group));
      });
      setAvailableGroups(Array.from(allGroups).sort());
    } catch (error: any) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserGroups([...user.groups]);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);

      // Save groups
      const groupsResponse = await fetch('/api/users/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.userId,
          groups: userGroups,
        }),
      });

      if (!groupsResponse.ok) {
        throw new Error('Failed to save user groups');
      }

      // Refresh users
      await loadUsers();
      setEditingUser(null);
      setUserGroups([]);
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert('Failed to save user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      const response = await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to set user role');
      }

      await loadUsers();
    } catch (error: any) {
      console.error('Error setting role:', error);
      alert('Failed to set role: ' + error.message);
    }
  };

  const toggleGroup = (groupName: string) => {
    setUserGroups(prev => {
      if (prev.includes(groupName)) {
        return prev.filter(g => g !== groupName);
      } else {
        return [...prev, groupName];
      }
    });
  };

  const addNewGroup = (groupName: string) => {
    if (groupName && !availableGroups.includes(groupName)) {
      setAvailableGroups([...availableGroups, groupName].sort());
      setUserGroups([...userGroups, groupName]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">User Groups Management</h2>
              <p className="text-sm text-gray-400">Manage user groups and roles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-400">Loading users...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.userId}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user.email ? user.email[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold">{user.email || user.userId}</div>
                        <div className="text-xs text-gray-400">{user.userId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleSetRole(user.userId, e.target.value as 'admin' | 'user')}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      {user.role === 'admin' && (
                        <Shield className="w-4 h-4 text-yellow-400" title="Admin" />
                      )}
                      <button
                        onClick={() => handleEditUser(user)}
                        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-sm transition-colors"
                      >
                        Edit Groups
                      </button>
                    </div>
                  </div>

                  {/* Current Groups */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.groups.length > 0 ? (
                      user.groups.map((group) => (
                        <span
                          key={group}
                          className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-xs"
                        >
                          {group}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No groups assigned</span>
                    )}
                  </div>

                  {/* Edit Groups Panel */}
                  {editingUser?.userId === user.userId && (
                    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-blue-500/30">
                      <div className="mb-3">
                        <label className="text-sm font-semibold mb-2 block">Assign Groups</label>
                        <div className="flex flex-wrap gap-2">
                          {availableGroups.map((group) => (
                            <button
                              key={group}
                              onClick={() => toggleGroup(group)}
                              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                userGroups.includes(group)
                                  ? 'bg-blue-500/30 border-blue-500 text-blue-300'
                                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {group}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            placeholder="Add new group name"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                if (input.value.trim()) {
                                  addNewGroup(input.value.trim());
                                  input.value = '';
                                }
                              }
                            }}
                            className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm"
                          />
                          <button
                            onClick={handleSaveUser}
                            disabled={saving}
                            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setUserGroups([]);
                            }}
                            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No users found</p>
                  <p className="text-sm mt-1">Users will appear here after they sign in</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

