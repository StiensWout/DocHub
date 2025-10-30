"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import type { Team } from "@/types";

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
}

export default function TeamSelector({ teams, selectedTeamId, onTeamChange }: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
      >
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium">{selectedTeam.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    onTeamChange(team.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                    selectedTeamId === team.id
                      ? "bg-blue-500/20 text-blue-400"
                      : "hover:bg-white/5 text-gray-300"
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
