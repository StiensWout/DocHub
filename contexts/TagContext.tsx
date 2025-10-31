"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface TagContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const TagContext = createContext<TagContextType | undefined>(undefined);

export function TagProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <TagContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </TagContext.Provider>
  );
}

export function useTagContext() {
  const context = useContext(TagContext);
  if (context === undefined) {
    throw new Error("useTagContext must be used within a TagProvider");
  }
  return context;
}

