"use client";

import { ChevronRight, Home } from "lucide-react";
import type { BreadcrumbItem } from "@/types";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  maxItems?: number; // For truncation (default: 5)
}

export default function Breadcrumbs({ items, maxItems = 5 }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  // On mobile, show simplified breadcrumbs or just back button
  const displayItems = items.length > maxItems 
    ? [items[0], { label: "...", onClick: undefined }, ...items.slice(-(maxItems - 2))]
    : items;

  return (
    <nav
      className="flex items-center gap-2 text-sm text-gray-400 transition-opacity duration-200"
      aria-label="Breadcrumb"
      role="navigation"
    >
      {/* Mobile: Show back button */}
      <div className="lg:hidden">
        {items.length > 1 && (
          <button
            onClick={items[items.length - 2]?.onClick}
            className="flex items-center gap-1 px-3 py-1 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={`Go back to ${items[items.length - 2]?.label || "previous page"}`}
          >
            <ChevronRight className="w-4 h-4 rotate-180" aria-hidden="true" />
            <span className="text-xs">Back</span>
          </button>
        )}
      </div>

      {/* Desktop: Show full breadcrumb trail */}
      <div className="hidden lg:flex items-center gap-2">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isClickable = item.onClick && !isLast;

          return (
            <div key={index} className="flex items-center gap-2">
              {index === 0 && item.label === "Home" && (
                <Home className="w-4 h-4" aria-hidden="true" />
              )}
              {isClickable ? (
                <button
                  onClick={item.onClick}
                  className="hover:text-white transition-colors flex items-center gap-1"
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.icon && <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ) : (
                <span
                  className={`
                    ${isLast ? "text-white font-medium" : ""}
                    flex items-center gap-1
                  `}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon && <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
              {!isLast && (
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
