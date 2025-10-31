"use client";

import type { Application } from "@/types";

interface ApplicationCardProps {
  application: Application;
  documentCount?: number;
  onClick: () => void;
}

// Helper function to get color values from color string (e.g., "blue-500")
function getColorValues(colorString: string) {
  const [colorName, shade] = (colorString || 'blue-500').split('-');
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
  };
  const baseColor = colorMap[colorName]?.[shadeNum] || colorMap.blue['500'];
  return {
    icon: baseColor,
    bg: `${baseColor}20`,
    border: `${baseColor}40`,
    hoverBg: `${baseColor}30`,
  };
}

export default function ApplicationCard({ application, documentCount, onClick }: ApplicationCardProps) {
  const colors = getColorValues(application.color || 'blue-500');
  const AppIcon = application.icon;

  return (
    <button
      onClick={onClick}
      className="group relative p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer text-left w-full"
      style={{
        borderColor: colors.border,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.hoverBg;
        e.currentTarget.style.borderColor = colors.border;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '';
        e.currentTarget.style.borderColor = colors.border;
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="p-3 rounded-lg border border-white/20 transition-transform group-hover:scale-110"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
          }}
        >
          <AppIcon className="w-6 h-6" style={{ color: colors.icon }} />
        </div>
        <div className="flex flex-col items-center gap-1 w-full">
          <h4 className="font-semibold group-hover:text-blue-400 transition-colors text-sm">
            {application.name}
          </h4>
          {documentCount !== undefined && (
            <p className="text-xs text-gray-400">
              {documentCount} {documentCount === 1 ? 'doc' : 'docs'}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

