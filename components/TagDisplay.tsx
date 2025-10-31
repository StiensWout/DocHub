"use client";

import { X } from "lucide-react";

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
}

interface TagDisplayProps {
  tags: Tag[];
  onRemove?: (tagId: string) => void;
  showRemove?: boolean;
  maxDisplay?: number;
  className?: string;
}

export default function TagDisplay({
  tags,
  onRemove,
  showRemove = false,
  maxDisplay,
  className = "",
}: TagDisplayProps) {
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const remainingCount = maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0;

  // Helper function to get color classes from color string
  const getColorClasses = (color?: string | null) => {
    if (!color) {
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }

    // Map Tailwind color classes to actual classes
    const colorMap: Record<string, string> = {
      "blue-500": "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "blue-600": "bg-blue-600/20 text-blue-300 border-blue-600/30",
      "purple-500": "bg-purple-500/20 text-purple-300 border-purple-500/30",
      "purple-600": "bg-purple-600/20 text-purple-300 border-purple-600/30",
      "green-500": "bg-green-500/20 text-green-300 border-green-500/30",
      "green-600": "bg-green-600/20 text-green-300 border-green-600/30",
      "red-500": "bg-red-500/20 text-red-300 border-red-500/30",
      "red-600": "bg-red-600/20 text-red-300 border-red-600/30",
      "orange-500": "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "orange-600": "bg-orange-600/20 text-orange-300 border-orange-600/30",
      "yellow-500": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      "yellow-600": "bg-yellow-600/20 text-yellow-300 border-yellow-600/30",
      "indigo-500": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      "indigo-600": "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",
      "pink-500": "bg-pink-500/20 text-pink-300 border-pink-500/30",
      "pink-600": "bg-pink-600/20 text-pink-300 border-pink-600/30",
      "teal-500": "bg-teal-500/20 text-teal-300 border-teal-500/30",
      "teal-600": "bg-teal-600/20 text-teal-300 border-teal-600/30",
      "cyan-500": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      "cyan-600": "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",
    };

    return colorMap[color] || colorMap["blue-500"];
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayTags.map((tag) => (
        <span
          key={tag.id}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${getColorClasses(tag.color)}`}
        >
          {tag.name}
          {showRemove && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(tag.id);
              }}
              className="hover:text-white transition-colors"
              aria-label={`Remove tag ${tag.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

