"use client";

import { useState, useEffect } from "react";
import { X, Users, Shield, Save, Loader2 } from "lucide-react";

interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user';
  groups: string[];
  organizations?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

interface OrganizationWithRoles {
  id: string;
  name: string;
  roles: string[]; // Available roles in this organization
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
  const [availableOrganizations, setAvailableOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]); // Available roles across all organizations
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userGroups, setUserGroups] = useState<string[]>([]); // Format: "orgId:role" or "orgName" for backward compatibility

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadOrganizations();
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
      
      // Extract unique groups from all users (for backward compatibility)
      const allGroups = new Set<string>();
      (data.users || []).forEach((user: User) => {
        user.groups.forEach(group => allGroups.add(group));
        // Also add organizations as groups
        if (user.organizations) {
          user.organizations.forEach(org => allGroups.add(org.name));
        }
      });
      setAvailableGroups(Array.from(allGroups).sort());
      
      // Extract unique roles from all users' organization memberships
      const allRoles = new Set<string>();
      (data.users || []).forEach((user: User) => {
        if (user.organizations) {
          user.organizations.forEach(org => {
            if (org.role) {
              // Handle both string and object roles
              const roleStr = typeof org.role === 'string' ? org.role : String(org.role);
              if (roleStr && roleStr.trim() !== '' && roleStr !== 'undefined' && roleStr !== 'null' && roleStr !== '[object Object]') {
                allRoles.add(roleStr.trim());
              }
            }
          });
        }
      });
      
      // Log extracted roles for debugging
      console.log('Extracted roles from memberships:', Array.from(allRoles));
      
      setAvailableRoles(Array.from(allRoles).sort());
    } catch (error: any) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();

      if (!response.ok) {
        console.warn('Failed to load organizations:', data.error);
        return;
      }

      setAvailableOrganizations(data.organizations || []);
    } catch (error: any) {
      console.error('Error loading organizations:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    // Get organization+role combinations from user.organizations
    // Format: "orgId:role" or fallback to "orgName:role"
    const userGroupsList: string[] = [];
    if (user.organizations) {
      user.organizations.forEach(org => {
        const role = org.role || 'member'; // Default role if not specified
        // Use format "orgId:role" for precise matching
        userGroupsList.push(`${org.id}:${role}`);
      });
    }
    // Also include legacy groups for backward compatibility
    user.groups.forEach(group => {
      if (!userGroupsList.includes(group)) {
        userGroupsList.push(group);
      }
    });
    setUserGroups(userGroupsList);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);

      // Parse userGroups which are in format "orgId:role"
      const selectedMemberships = userGroups
        .filter(g => g.includes(':'))
        .map(g => {
          const [orgId, role] = g.split(':');
          return { orgId, role };
        })
        .filter(m => m.orgId && m.role);

      // Get current user's memberships in format "orgId:role"
      const currentMemberships = editingUser.organizations 
        ? editingUser.organizations.map(org => ({
            orgId: org.id,
            role: org.role || 'member',
          }))
        : [];

      // Create maps for easier comparison
      const selectedMap = new Map(
        selectedMemberships.map(m => [`${m.orgId}:${m.role}`, m])
      );
      const currentMap = new Map(
        currentMemberships.map(m => [`${m.orgId}:${m.role}`, m])
      );

      // Find memberships to add (in selected but not current)
      const membershipsToAdd = selectedMemberships.filter(
        m => !currentMap.has(`${m.orgId}:${m.role}`)
      );

      // Find memberships to remove (in current but not selected)
      // Also find memberships to update (same org but different role)
      const membershipsToRemove: Array<{ orgId: string; role: string }> = [];
      const membershipsToUpdate: Array<{ orgId: string; oldRole: string; newRole: string }> = [];

      currentMemberships.forEach(current => {
        const key = `${current.orgId}:${current.role}`;
        const selected = selectedMap.get(key);
        
        if (!selected) {
          // Check if user still has this org with a different role
          const orgStillExists = selectedMemberships.some(m => m.orgId === current.orgId);
          
          if (orgStillExists) {
            // Find the new role for this org
            const newMembership = selectedMemberships.find(m => m.orgId === current.orgId);
            if (newMembership) {
              membershipsToUpdate.push({
                orgId: current.orgId,
                oldRole: current.role,
                newRole: newMembership.role,
              });
            }
          } else {
            // User is being removed from this org entirely
            membershipsToRemove.push(current);
          }
        }
      });

      // Update WorkOS organization memberships
      const updatePromises: Promise<any>[] = [];

      // Remove old memberships first (to avoid conflicts)
      for (const membership of membershipsToRemove) {
        updatePromises.push(
          fetch('/api/organizations/membership', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: editingUser.userId,
              organizationId: membership.orgId,
              action: 'remove',
            }),
          })
        );
      }

      // Update role changes (remove old, add new)
      for (const update of membershipsToUpdate) {
        // Remove old membership
        updatePromises.push(
          fetch('/api/organizations/membership', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: editingUser.userId,
              organizationId: update.orgId,
              action: 'remove',
            }),
          })
        );
        // Add with new role
        updatePromises.push(
          fetch('/api/organizations/membership', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: editingUser.userId,
              organizationId: update.orgId,
              action: 'add',
              role: update.newRole,
            }),
          })
        );
      }

      // Add new memberships (with roles)
      for (const membership of membershipsToAdd) {
        updatePromises.push(
          fetch('/api/organizations/membership', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: editingUser.userId,
              organizationId: membership.orgId,
              action: 'add',
              role: membership.role,
            }),
          })
        );
      }

      // Execute all updates
      const results = await Promise.allSettled(updatePromises);
      
      // Check for failures
      const failures = results.filter(r => r.status === 'rejected' || 
        (r.status === 'fulfilled' && !r.value.ok));
      
      if (failures.length > 0) {
        const errorMessages: string[] = [];
        for (const failure of failures) {
          if (failure.status === 'rejected') {
            errorMessages.push(`Failed: ${failure.reason}`);
          } else {
            try {
              const errorData = await failure.value.json();
              errorMessages.push(`Failed: ${errorData.error || 'Unknown error'}`);
            } catch {
              errorMessages.push(`Failed: Unknown error`);
            }
          }
        }
        
        if (failures.length === results.length) {
          // All failed
          throw new Error(`Failed to update organization memberships:\n${errorMessages.join('\n')}`);
        } else {
          // Partial failure
          alert(`⚠️ Some updates failed:\n${errorMessages.join('\n')}\n\nPlease check the current state and try again.`);
        }
      } else {
        alert('✅ Organization memberships updated successfully!');
      }

      // Refresh users
      await loadUsers();
      setEditingUser(null);
      setUserGroups([]);
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert('Failed to save user organizations:\n\n' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      setSaving(true);
      const response = await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Build error message with details
        let errorMessage = data.error || 'Failed to set user role';
        if (data.details) {
          errorMessage += `\n\nDetails: ${data.details}`;
        }
        if (data.rollback) {
          errorMessage += `\n\nRollback: ${data.rollback}`;
        }
        throw new Error(errorMessage);
      }

      // Show success message with details
      let successMessage = 'Role updated successfully!';
      if (data.message) {
        successMessage += `\n\n${data.message}`;
      }
      if (data.organizationsUpdated !== undefined) {
        successMessage += `\n\nUpdated ${data.organizationsUpdated} WorkOS organization(s).`;
      }
      if (data.warning) {
        successMessage += `\n\n⚠️ Warning: ${data.warning}`;
      }
      if (data.partialFailure) {
        successMessage += '\n\n⚠️ Some WorkOS updates failed. Check logs for details.';
      }
      
      alert(successMessage);
      
      // Refresh users to get updated data
      await loadUsers();
    } catch (error: any) {
      console.error('Error setting role:', error);
      alert('Failed to set role:\n\n' + error.message);
    } finally {
      setSaving(false);
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user.email ? user.email[0].toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.email || user.userId}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{user.email || user.userId}</div>
                        {user.userId && (
                          <div className="text-xs text-gray-500 font-mono truncate">{user.userId}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleSetRole(user.userId, e.target.value as 'admin' | 'user')}
                        disabled={saving}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* WorkOS Organizations */}
                  {user.organizations && user.organizations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-gray-400 mb-2">WorkOS Organizations:</div>
                      <div className="flex flex-wrap gap-2">
                        {user.organizations.map((org) => (
                          <div
                            key={org.id}
                            className="px-2 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-xs flex items-center gap-2"
                          >
                            <span className="font-medium">{org.name}</span>
                            {org.role && (
                              <span className="text-purple-300">({org.role})</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        💡 Role changes update both database and WorkOS organization membership
                      </div>
                    </div>
                  )}

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
                        <label className="text-sm font-semibold mb-2 block">Assign WorkOS Organizations & Roles</label>
                        <select
                          multiple
                          value={userGroups}
                          onChange={(e) => {
                            const selectedGroups = Array.from(e.target.selectedOptions, option => option.value);
                            setUserGroups(selectedGroups);
                          }}
                          className="w-full min-h-[200px] px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          size={Math.min(availableOrganizations.length * (availableRoles.length + 1), 10)}
                        >
                          {availableOrganizations.length === 0 ? (
                            <option disabled>No organizations available. Create organizations in WorkOS first.</option>
                          ) : (
                            availableOrganizations.map((org) => {
                              // Show organization with all available roles
                              // Default roles if none exist: 'admin', 'member', 'user'
                              const rolesToShow = availableRoles.length > 0 
                                ? availableRoles 
                                : ['admin', 'member', 'user'];
                              
                              return (
                                <optgroup key={org.id} label={org.name} className="bg-[#2a2a2a]">
                                  {rolesToShow.map((role) => {
                                    const optionValue = `${org.id}:${role}`;
                                    return (
                                      <option
                                        key={optionValue}
                                        value={optionValue}
                                        className="bg-[#1a1a1a] text-white pl-4"
                                      >
                                        {org.name} - {role}
                                      </option>
                                    );
                                  })}
                                </optgroup>
                              );
                            })
                          )}
                        </select>
                        <div className="mt-2 text-xs text-gray-400">
                          Hold Ctrl/Cmd to select multiple organization+role combinations
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={handleSaveUser}
                            disabled={saving || availableOrganizations.length === 0}
                            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

