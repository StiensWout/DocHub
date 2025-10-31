"use client";

import type { ApplicationGroup, Application } from "@/types";
import ApplicationCard from "./ApplicationCard";
import { Layers } from "lucide-react";

interface GroupSectionProps {
  group: ApplicationGroup;
  applications: Application[];
  documentCounts?: Record<string, number>;
  onAppClick: (appId: string) => void;
  onGroupClick?: () => void;
}

// Helper function to get color values from color string (e.g., "blue-500")
function getColorValues(colorString: string) {
  const [colorName, shade] = (colorString || 'gray-500').split('-');
  const shadeNum = shade || '500';
  const colorMap: Record<string, Record<string, string>> = {
    blue: { '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb' },
    purple: { '400': '#c084fc', '500': '#a855f7', '600': '#9333ea' },
    green: { '400': '#4ade80', '500': '#22c55e', '600': '#16a34a' },
    red: { '400': '#f87171', '500': '#ef4444', '600': '#dc2626' },
    orange: { '400': '#fb923c', '500': '#f97316', '600': '#ea580c' },
    yellow: { '400': '#facc15', '500': '#eab308', '600': '#ca8a04' },
    indigo: { '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5' },
    pink: { '400': '#f472b6', '500': '#ec4899', '600': '#db2777' },
    teal: { '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488' },
    cyan: { '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2' },
    gray: { '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563' },
  };
  const baseColor = colorMap[colorName]?.[shadeNum] || colorMap.gray['500'];
  return {
    icon: baseColor,
    bg: `${baseColor}20`,
    border: `${baseColor}40`,
  };
}

export default function GroupSection({ group, applications, documentCounts, onAppClick, onGroupClick }: GroupSectionProps) {
  const GroupIcon = group.icon || Layers;
  const groupColors = group.color ? getColorValues(group.color) : getColorValues('gray-500');

  if (applications.length === 0) {
    return null; // Don't render empty groups
  }

  return (
    <div className="mb-8">
      {/* Group Header */}
      <div 
        className={`flex items-center gap-3 mb-4 ${onGroupClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={onGroupClick}
      >
        <div
          className="p-2 rounded-lg border border-white/20"
          style={{
            backgroundColor: groupColors.bg,
            borderColor: groupColors.border,
          }}
        >
          <GroupIcon className="w-5 h-5" style={{ color: groupColors.icon }} />
        </div>
        <div>
          <h3 className="text-xl font-semibold">{group.name}</h3>
          <p className="text-sm text-gray-400">{applications.length} {applications.length === 1 ? 'application' : 'applications'}</p>
        </div>
      </div>

      {/* Application Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            documentCount={documentCounts?.[app.id]}
            onClick={() => onAppClick(app.id)}
          />
        ))}
      </div>
    </div>
  );
}

