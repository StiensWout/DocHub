/**
 * In-memory cache for organization memberships
 * 
 * This cache stores organization memberships per user to avoid
 * redundant API calls within the same request/operation.
 * 
 * The cache is cleared after each request to ensure fresh data.
 */

import type { EnrichedMembership } from './organizations';

// Simple in-memory cache (per process, cleared on server restart)
const membershipCache = new Map<string, {
  data: EnrichedMembership[];
  timestamp: number;
}>();

// Cache TTL: 5 minutes (300000ms)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get cached memberships or null if not cached/expired
 */
export function getCachedMemberships(userId: string): EnrichedMembership[] | null {
  const cached = membershipCache.get(userId);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    membershipCache.delete(userId);
    return null;
  }
  
  return cached.data;
}

/**
 * Store memberships in cache
 */
export function setCachedMemberships(userId: string, memberships: EnrichedMembership[]): void {
  membershipCache.set(userId, {
    data: memberships,
    timestamp: Date.now(),
  });
}

/**
 * Clear cache for a specific user
 */
export function clearCachedMemberships(userId: string): void {
  membershipCache.delete(userId);
}

/**
 * Clear all cached memberships
 */
export function clearAllCachedMemberships(): void {
  membershipCache.clear();
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats() {
  return {
    size: membershipCache.size,
    keys: Array.from(membershipCache.keys()),
  };
}

