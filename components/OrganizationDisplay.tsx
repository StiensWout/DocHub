"use client";

import { useState, useEffect } from "react";
import { Building2, ChevronDown, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  role: string;
  createdAt: string;
  parentTeam: {
    id: string;
    name: string;
  } | null;
  teams: Array<{
    id: string;
    name: string;
  }>;
}

interface Team {
  id: string;
  name: string;
}

interface OrganizationDisplayProps {
  className?: string;
  isAdmin?: boolean;
  teams?: Team[];
  selectedTeamId?: string;
  onTeamChange?: (teamId: string) => void;
}

export default function OrganizationDisplay({ 
  className = "", 
  isAdmin = false,
  teams = [],
  selectedTeamId = "",
  onTeamChange
}: OrganizationDisplayProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentTeam, setCurrentTeam] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Restore current team from localStorage when org loads
  useEffect(() => {
    if (currentOrg && !currentTeam) {
      const savedTeamName = localStorage.getItem("currentTeamName");
      if (savedTeamName) {
        // Verify the team exists in current org
        const teamExists = currentOrg.teams.some(t => t.name === savedTeamName);
        if (teamExists) {
          setCurrentTeam(savedTeamName);
        }
      } else if (currentOrg.teams.length > 0) {
        // User has one team (their role) - set it as current
        setCurrentTeam(currentOrg.teams[0].name);
      }
    }
  }, [currentOrg, currentTeam]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/user/organizations");
      if (!response.ok) return;

      const data = await response.json();
      setOrganizations(data.organizations || []);

      // Set current organization (first one for now, or from localStorage)
      if (data.organizations && data.organizations.length > 0) {
        const savedOrgId = localStorage.getItem("currentOrgId");
        const org = savedOrgId
          ? data.organizations.find((o: Organization) => o.id === savedOrgId)
          : data.organizations[0];
        
        setCurrentOrg(org || data.organizations[0]);

        // Set current team (from localStorage or first subgroup)
        const savedTeamId = localStorage.getItem("currentTeamId");
        if (savedTeamId && org) {
          const team = org.teams.find((t: any) => t.id === savedTeamId);
          if (team) {
            setCurrentTeam(team.name);
          }
        } else if (org && org.teams.length > 0) {
          // User has one team (their role) - set it as current
          setCurrentTeam(org.teams[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem("currentOrgId", org.id);
    setShowDropdown(false);
    router.refresh();
  };

  const handleTeamChange = (teamName: string) => {
    setCurrentTeam(teamName);
    localStorage.setItem("currentTeamName", teamName);
    if (currentOrg) {
      const team = currentOrg.teams.find(t => t.name === teamName);
      if (team) {
        localStorage.setItem("currentTeamId", team.id);
      }
    }
    setShowDropdown(false);
    router.refresh();
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building2 className="w-4 h-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  // Get selected team name for display (for admins, show from teams list)
  const selectedTeamName = isAdmin && teams.length > 0 && selectedTeamId
    ? teams.find(t => t.id === selectedTeamId)?.name || ""
    : currentTeam;

  if (!currentOrg && !isAdmin) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-colors"
      >
        <Building2 className="w-4 h-4 text-blue-400" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-white">{currentOrg?.name || "Organization"}</span>
          {selectedTeamName && (
            <span className="text-xs text-gray-400">{selectedTeamName}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase mb-2">
                Organizations
              </div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgChange(org)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-1 ${
                    currentOrg.id === org.id
                      ? "bg-blue-600/20 text-blue-400"
                      : "hover:bg-gray-700/50 text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{org.name}</span>
                    {org.role && typeof org.role === 'string' && org.role.trim() !== '' && (
                      <span className="text-xs text-gray-400">({org.role})</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Show all teams for admins, otherwise show only user's team */}
            {isAdmin && teams.length > 0 ? (
              <>
                <div className="border-t border-gray-700 my-1" />
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase mb-2">
                    All Teams
                  </div>
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        if (onTeamChange) {
                          onTeamChange(team.id);
                        }
                        setShowDropdown(false);
                        router.refresh();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-1 ${
                        selectedTeamId === team.id
                          ? "bg-blue-600/20 text-blue-400"
                          : "hover:bg-gray-700/50 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>{team.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : currentOrg && currentOrg.teams.length > 0 ? (
              <>
                <div className="border-t border-gray-700 my-1" />
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase mb-2">
                    Teams (Roles)
                  </div>
                  {currentOrg.teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => handleTeamChange(team.name)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-1 ${
                        currentTeam === team.name
                          ? "bg-blue-600/20 text-blue-400"
                          : "hover:bg-gray-700/50 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>{team.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : currentOrg && currentOrg.teams.length === 0 ? (
              <>
                <div className="border-t border-gray-700 my-1" />
                <div className="p-2">
                  <div className="px-3 py-2 text-sm text-gray-400">
                    No teams yet. Teams are created from your role in this organization.
                  </div>
                </div>
              </>
            ) : null}

            <div className="border-t border-gray-700 my-1" />
            <div className="p-2">
              <Link
                href="/profile"
                onClick={() => setShowDropdown(false)}
                className="block w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-700/50 text-gray-300 transition-colors"
              >
                View Profile
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

