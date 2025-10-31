"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import type { Tag } from "./TagDisplay";

interface TagSelectorProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
  disabled?: boolean;
}

export default function TagSelector({
  selectedTags,
  onChange,
  placeholder = "Add tags...",
  className = "",
  maxTags,
  disabled = false,
}: TagSelectorProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch tag suggestions
  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tags?q=${encodeURIComponent(query.trim())}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out already selected tags
          const filtered = (data.tags || []).filter(
            (tag: Tag) => !selectedTags.some((st) => st.id === tag.id)
          );
          setSuggestions(filtered);
        }
      } catch (error) {
        console.error("Error fetching tag suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query, selectedTags]);

  // Show suggestions when query has content (either existing tags or option to create new)
  useEffect(() => {
    setShowSuggestions(query.trim().length > 0);
  }, [query]);

  // Handle clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSuggestions]);

  const handleAddTag = (tag: Tag) => {
    if (maxTags && selectedTags.length >= maxTags) {
      return;
    }
    if (!selectedTags.some((st) => st.id === tag.id)) {
      onChange([...selectedTags, tag]);
      setQuery("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  const handleCreateNewTag = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: query.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403) {
          alert("Only administrators can create new tags. Please contact an admin to create this tag.");
        } else {
          alert(`Failed to create tag: ${error.error || "Unknown error"}`);
        }
        return;
      }

      const data = await response.json();
      const newTag = data.tag;
      
      // Add the newly created tag
      handleAddTag(newTag);
      setQuery("");
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("Failed to create tag. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && query.trim().length > 0) {
      const totalOptions = suggestions.length + (suggestions.some(tag => tag.name.toLowerCase() === query.trim().toLowerCase()) ? 0 : 1);
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < totalOptions - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : totalOptions - 1
        );
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const hasCreateOption = !suggestions.some(tag => tag.name.toLowerCase() === query.trim().toLowerCase());
        const createOptionIndex = hasCreateOption ? suggestions.length : -1;
        
        if (activeIndex === createOptionIndex && hasCreateOption) {
          handleCreateNewTag();
        } else if (activeIndex < suggestions.length) {
          handleAddTag(suggestions[activeIndex]);
        }
        setActiveIndex(-1);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setActiveIndex(-1);
      } else if (e.key === "Enter" && activeIndex === -1 && query.trim().length > 0 && 
                 !suggestions.some(tag => tag.name.toLowerCase() === query.trim().toLowerCase())) {
        // Create new tag if Enter pressed and no existing tag matches
        e.preventDefault();
        handleCreateNewTag();
      }
    } else if (e.key === "Backspace" && query === "" && selectedTags.length > 0) {
      // Remove last tag on backspace when input is empty
      handleRemoveTag(selectedTags[selectedTags.length - 1].id);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2 p-2 bg-white/5 border border-white/10 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
          >
            {tag.name}
            {!disabled && (
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:text-white transition-colors"
                aria-label={`Remove tag ${tag.name}`}
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          disabled={disabled || (maxTags ? selectedTags.length >= maxTags : false)}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder-gray-400 focus:placeholder-gray-500"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-2 w-full bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl max-h-[200px] overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Show existing tag suggestions */}
              {suggestions.map((tag, index) => (
                <button
                  key={tag.id}
                  onClick={() => handleAddTag(tag)}
                  className={`w-full text-left p-3 hover:bg-white/5 transition-colors ${
                    index === activeIndex ? "bg-white/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{tag.name}</span>
                  </div>
                </button>
              ))}
              
              {/* Show "Create new tag" option if query doesn't match any existing tag */}
              {suggestions.length === 0 && query.trim().length > 0 && (
                <button
                  onClick={handleCreateNewTag}
                  className={`w-full text-left p-3 hover:bg-white/5 transition-colors border-t border-white/5 ${
                    activeIndex === 0 ? "bg-white/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-400 font-medium">
                      Create tag "{query.trim()}"
                    </span>
                  </div>
                </button>
              )}
              
              {/* Show "Create new tag" option even when there are suggestions */}
              {suggestions.length > 0 && 
               !suggestions.some(tag => tag.name.toLowerCase() === query.trim().toLowerCase()) && 
               query.trim().length > 0 && (
                <button
                  onClick={handleCreateNewTag}
                  className={`w-full text-left p-3 hover:bg-white/5 transition-colors border-t border-white/5 ${
                    activeIndex === suggestions.length ? "bg-white/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-400 font-medium">
                      Create tag "{query.trim()}"
                    </span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

