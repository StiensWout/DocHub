"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
  availableIcons?: string[];
}

// Common Lucide icons for applications (curated list)
const COMMON_ICONS = [
  "Globe", "Database", "Zap", "Settings", "Server", "Cloud", "Code", "Box",
  "Layers", "Package", "FileText", "BookOpen", "Folder", "Grid", "Layout",
  "Monitor", "Smartphone", "Tablet", "HardDrive", "Key", "Lock", "Shield",
  "Users", "User", "Mail", "MessageSquare", "Bell", "Calendar", "Clock",
  "BarChart", "PieChart", "TrendingUp", "DollarSign", "ShoppingCart",
  "Map", "Compass", "Camera", "Image", "Video", "Music", "Film",
  "Gamepad2", "Heart", "Star", "Bookmark", "Flag", "Tag", "Filter",
  "Search", "Home", "Building", "Store", "ShoppingBag", "Briefcase",
  "Coffee", "Utensils", "Car", "Plane", "Ship", "Bike", "Wrench",
  "Tool", "Hammer", "Paintbrush", "Palette", "Sparkles", "Rocket",
  "Target", "Award", "Trophy", "Crown", "Diamond", "Gem", "Infinity",
];

export default function IconPicker({ selectedIcon, onSelect, availableIcons }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get all available icons from Lucide React
  const iconNames = useMemo(() => {
    if (availableIcons) {
      return availableIcons;
    }
    
    // Get all exported icons from lucide-react
    const allIcons = Object.keys(LucideIcons).filter(
      (key) => key !== "createLucideIcon" && typeof LucideIcons[key as keyof typeof LucideIcons] === "function"
    ) as string[];
    
    // Filter to common icons or allow all
    return COMMON_ICONS.filter(icon => allIcons.includes(icon));
  }, [availableIcons]);

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return iconNames;
    }
    const query = searchQuery.toLowerCase();
    return iconNames.filter(name => name.toLowerCase().includes(query));
  }, [iconNames, searchQuery]);

  const getIconComponent = (iconName: string): LucideIcon | null => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon;
    return Icon || null;
  };

  const handleIconSelect = (iconName: string) => {
    onSelect(iconName);
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search icons..."
          className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Icon Grid */}
      <div className="max-h-[300px] overflow-y-auto border border-white/10 rounded-lg p-2 bg-white/5">
        {filteredIcons.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No icons found matching "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-2">
            {filteredIcons.map((iconName) => {
              const Icon = getIconComponent(iconName);
              const isSelected = selectedIcon === iconName;

              if (!Icon) return null;

              return (
                <button
                  key={iconName}
                  onClick={() => handleIconSelect(iconName)}
                  className={`
                    p-2 rounded-lg border transition-all
                    flex items-center justify-center
                    ${isSelected
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20"
                    }
                  `}
                  title={iconName}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Icon Preview */}
      {selectedIcon && (
        <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
          <span className="text-xs text-gray-400">Selected:</span>
          {getIconComponent(selectedIcon) && (
            <>
              {(() => {
                const SelectedIcon = getIconComponent(selectedIcon)!;
                return <SelectedIcon className="w-4 h-4 text-gray-400" />;
              })()}
              <span className="text-sm text-white">{selectedIcon}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

