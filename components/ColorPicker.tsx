"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
  colors?: string[];
  disabled?: boolean;
}

// Predefined Tailwind color palette
const DEFAULT_COLORS = [
  // Blue shades
  { name: "Blue-500", value: "blue-500", hex: "#3b82f6" },
  { name: "Blue-600", value: "blue-600", hex: "#2563eb" },
  { name: "Blue-400", value: "blue-400", hex: "#60a5fa" },
  // Purple shades
  { name: "Purple-500", value: "purple-500", hex: "#a855f7" },
  { name: "Purple-600", value: "purple-600", hex: "#9333ea" },
  { name: "Purple-400", value: "purple-400", hex: "#c084fc" },
  // Green shades
  { name: "Green-500", value: "green-500", hex: "#22c55e" },
  { name: "Green-600", value: "green-600", hex: "#16a34a" },
  { name: "Green-400", value: "green-400", hex: "#4ade80" },
  // Red shades
  { name: "Red-500", value: "red-500", hex: "#ef4444" },
  { name: "Red-600", value: "red-600", hex: "#dc2626" },
  { name: "Red-400", value: "red-400", hex: "#f87171" },
  // Orange shades
  { name: "Orange-500", value: "orange-500", hex: "#f97316" },
  { name: "Orange-600", value: "orange-600", hex: "#ea580c" },
  { name: "Orange-400", value: "orange-400", hex: "#fb923c" },
  // Yellow shades
  { name: "Yellow-500", value: "yellow-500", hex: "#eab308" },
  { name: "Yellow-600", value: "yellow-600", hex: "#ca8a04" },
  { name: "Yellow-400", value: "yellow-400", hex: "#facc15" },
  // Indigo shades
  { name: "Indigo-500", value: "indigo-500", hex: "#6366f1" },
  { name: "Indigo-600", value: "indigo-600", hex: "#4f46e5" },
  { name: "Indigo-400", value: "indigo-400", hex: "#818cf8" },
  // Pink shades
  { name: "Pink-500", value: "pink-500", hex: "#ec4899" },
  { name: "Pink-600", value: "pink-600", hex: "#db2777" },
  { name: "Pink-400", value: "pink-400", hex: "#f472b6" },
  // Teal shades
  { name: "Teal-500", value: "teal-500", hex: "#14b8a6" },
  { name: "Teal-600", value: "teal-600", hex: "#0d9488" },
  { name: "Teal-400", value: "teal-400", hex: "#2dd4bf" },
  // Cyan shades
  { name: "Cyan-500", value: "cyan-500", hex: "#06b6d4" },
  { name: "Cyan-600", value: "cyan-600", hex: "#0891b2" },
  { name: "Cyan-400", value: "cyan-400", hex: "#22d3ee" },
];

export default function ColorPicker({ selectedColor, onSelect, colors, disabled }: ColorPickerProps) {
  const colorPalette = colors 
    ? colors.map(color => {
        const found = DEFAULT_COLORS.find(c => c.value === color);
        return found || { name: color, value: color, hex: "#808080" };
      })
    : DEFAULT_COLORS;

  const handleColorSelect = (colorValue: string) => {
    onSelect(colorValue);
  };

  const getCurrentColorHex = () => {
    const color = colorPalette.find(c => c.value === selectedColor);
    return color?.hex || "#808080";
  };

  return (
    <div className="w-full">
      {/* Color Grid */}
      <div className="grid grid-cols-8 gap-2 mb-4">
        {colorPalette.map((color) => {
          const isSelected = selectedColor === color.value;
          return (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              disabled={disabled}
              className={`
                relative aspect-square rounded-lg border-2 transition-all
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${isSelected
                  ? "border-white scale-110 shadow-lg shadow-blue-500/50"
                  : "border-white/20 hover:border-white/40 hover:scale-105"
                }
              `}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Color Preview */}
      <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
        <div
          className="w-8 h-8 rounded border-2 border-white/20"
          style={{ backgroundColor: getCurrentColorHex() }}
        />
        <div className="flex-1">
          <div className="text-xs text-gray-400">Selected Color</div>
          <div className="text-sm text-white font-medium">
            {colorPalette.find(c => c.value === selectedColor)?.name || selectedColor}
          </div>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {selectedColor}
        </div>
      </div>
    </div>
  );
}

