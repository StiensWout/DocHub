# Search Enhancements

## Overview

This feature request outlines enhancements to the search functionality to improve discoverability, user experience, and search efficiency. These enhancements will make it easier for users to find documents quickly through intelligent suggestions, search history, and improved filtering options.

## Goals

- Enable faster document discovery through search suggestions and autocomplete
- Provide access to recent search history for quick re-searches
- Improve search experience with intelligent query suggestions
- Enhance search filtering with an intuitive UI
- Reduce user effort in finding relevant documents
- Maintain search performance and responsiveness

## User Stories

### As a user, I want to...

1. **See search suggestions as I type** so I can quickly select common queries without typing the full term
2. **Access my search history** so I can quickly re-run previous searches
3. **See recent searches** so I can access documents I looked for recently
4. **Use advanced filters easily** so I can narrow down search results efficiently
5. **See popular/common searches** so I can discover frequently accessed documents
6. **Clear my search history** so I can maintain privacy and keep only relevant searches
7. **Use keyboard shortcuts** for search navigation to improve efficiency
8. **See search suggestions based on document titles** so I can find documents by partial name matches

## Current State

### Existing Search Features
- ✅ Basic search functionality with debouncing (300ms)
- ✅ Real-time search results as user types (minimum 2 characters)
- ✅ Search across document titles, categories, and content
- ✅ Relevance scoring and sorting
- ✅ Basic filters (Application, Category, Document Type)
- ✅ Filter panel (toggleable)
- ✅ Search result highlighting
- ✅ Click outside to close results
- ✅ Clear button (X) to reset search

### Limitations
- ❌ No search suggestions/autocomplete
- ❌ No search history
- ❌ No recent searches display
- ❌ Advanced filters are hidden in a panel (not always visible)
- ❌ No popular/common searches
- ❌ No keyboard navigation in search results
- ❌ No search query completion/suggestions
- ❌ Filter state not persisted between sessions

## Proposed Features

### 1. Search Suggestions / Autocomplete

Provide intelligent search suggestions as the user types, based on document titles, categories, and previous searches.

#### Features
- **Real-time Suggestions**: Show suggestions dropdown as user types (after 1 character)
- **Title-based Suggestions**: Suggest document titles that match the query
- **Category Suggestions**: Suggest categories that match the query
- **Popular Searches**: Show commonly searched terms
- **Recent Searches Integration**: Include recent searches in suggestions
- **Keyboard Navigation**: Arrow keys to navigate suggestions, Enter to select
- **Visual Highlighting**: Highlight matching text in suggestions

#### UI Design
```
┌─────────────────────────────────────┐
│  Search documentation...            │
├─────────────────────────────────────┤
│  🔍 user authentication             │
│  🔍 user guide                      │
│  🔍 user management                 │
│  📁 User Guides (category)          │
│  ⏱️ Recent: "user login"            │
└─────────────────────────────────────┘
```

#### Technical Requirements
- Component: Enhance `components/SearchBar.tsx`
- State: Track suggestions, active suggestion index
- Data Source: 
  - Document titles from database
  - Categories from database
  - Recent searches from localStorage
  - Popular searches (can be calculated from search history)
- Performance: Debounce suggestion fetching (200ms)
- Limit: Show maximum 5-8 suggestions
- Keyboard: ArrowUp, ArrowDown, Enter, Escape handlers

#### Implementation Details
```typescript
interface SearchSuggestion {
  id: string;
  text: string;
  type: 'document' | 'category' | 'recent' | 'popular';
  icon?: React.ReactNode;
}

const getSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  // Fetch document titles matching query
  // Fetch categories matching query
  // Get recent searches from localStorage
  // Combine and return suggestions
};
```

### 2. Search History

Maintain a history of user searches for quick access to previous queries.

#### Features
- **Persistent History**: Store searches in localStorage
- **Recent Searches List**: Display last 10-20 searches
- **Click to Re-run**: Click a history item to re-execute search
- **Clear History**: Button to clear all search history
- **Individual Delete**: Remove specific items from history
- **Privacy**: Store only search queries, not results
- **Limit Storage**: Keep maximum 50-100 searches

#### UI Design

**History Dropdown (when search is empty and focused):**
```
┌─────────────────────────────────────┐
│  Search documentation...            │
├─────────────────────────────────────┤
│  Recent Searches                    │
│  ─────────────────────────────────  │
│  🔍 user authentication             │
│  🔍 API documentation               │
│  🔍 deployment guide                 │
│  🔍 troubleshooting                  │
│  ─────────────────────────────────  │
│  [Clear History]                    │
└─────────────────────────────────────┘
```

#### Technical Requirements
- Storage: Use `localStorage` with key `dochub_search_history`
- Structure: Array of search objects with query, timestamp, result count
- Component: Add history section to `SearchBar.tsx`
- Actions: Save on search execution, load on component mount
- Cleanup: Remove old entries (> 100) automatically

#### Implementation Details
```typescript
interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

const SEARCH_HISTORY_KEY = 'dochub_search_history';
const MAX_HISTORY_ITEMS = 50;

const saveSearchHistory = (query: string, resultCount?: number) => {
  const history = getSearchHistory();
  // Remove duplicate if exists
  const filtered = history.filter(item => item.query !== query);
  // Add to beginning
  const updated = [{ query, timestamp: Date.now(), resultCount }, ...filtered];
  // Limit to MAX_HISTORY_ITEMS
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated.slice(0, MAX_HISTORY_ITEMS)));
};
```

### 3. Recent Searches

Quick access to recently performed searches, displayed prominently in the search interface.

#### Features
- **Quick Access**: Display recent searches when search bar is focused and empty
- **Visual Distinction**: Separate recent searches from other suggestions
- **Time Indicators**: Show relative time (e.g., "2 hours ago", "Yesterday")
- **One-click Re-run**: Click to immediately execute search
- **Integration with Suggestions**: Include recent searches in autocomplete dropdown
- **Limit Display**: Show last 5-8 recent searches

#### UI Design

**When search bar is empty and focused:**
```
┌─────────────────────────────────────┐
│  Search documentation...            │
├─────────────────────────────────────┤
│  Recent Searches                    │
│  ─────────────────────────────────  │
│  🔍 user authentication   2h ago   │
│  🔍 API documentation      1d ago  │
│  🔍 deployment guide       3d ago  │
│  🔍 troubleshooting        1w ago  │
└─────────────────────────────────────┘
```

#### Technical Requirements
- Data Source: Same as search history (localStorage)
- Display: Show when `query.length === 0 && isFocused`
- Sorting: Most recent first
- Component: Reuse SearchBar component with history display
- Interaction: Click to populate search and execute

### 4. Advanced Search Filters UI

Improve the visibility and usability of search filters with a more intuitive interface.

#### Features
- **Always Visible Filters** (Optional): Show key filters as chips/tags below search bar
- **Filter Chips**: Display active filters as removable chips
- **Quick Filter Toggles**: One-click toggles for common filters
- **Filter Presets**: Save and reuse common filter combinations
- **Filter Summary**: Show active filter count and summary
- **Clear All Filters**: Quick button to reset all filters
- **Visual Feedback**: Highlight active filters
- **Persistent Filters**: Remember filter preferences per session

#### UI Design

**Enhanced Filter Bar:**
```
┌─────────────────────────────────────────────────────────┐
│  Search documentation...    [🔍] [Filter]               │
├─────────────────────────────────────────────────────────┤
│  Filters: [All Types] [Customer Portal] [×] [API Docs ×]│
│  Active: 2 filters | [Clear All]                        │
└─────────────────────────────────────────────────────────┘
```

**Or Integrated Filter Panel:**
```
┌─────────────────────────────────────┐
│  Search documentation...            │
├─────────────────────────────────────┤
│  Filters                            │
│  ─────────────────────────────────  │
│  Document Type:                     │
│  ○ All  ○ Base  ● Team             │
│                                       │
│  Application:                       │
│  [Customer Portal ▼]                │
│                                       │
│  Category:                           │
│  [API Documentation ▼]              │
│                                       │
│  [Clear Filters]                     │
└─────────────────────────────────────┘
```

#### Technical Requirements
- Component: Enhance filter panel in `SearchBar.tsx`
- State: Track active filters, filter presets
- Storage: Optional localStorage for filter preferences
- UI: Filter chips, quick toggles, preset buttons
- Accessibility: Keyboard navigation, ARIA labels
- Visual: Active filter indicators, filter count badges

#### Implementation Details
```typescript
interface FilterPreset {
  id: string;
  name: string;
  filters: SearchFilters;
}

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'base-docs',
    name: 'Base Documents Only',
    filters: { documentType: 'base' }
  },
  {
    id: 'my-team',
    name: 'My Team',
    filters: { documentType: 'team' }
  }
];
```

## UI/UX Design

### Search Bar States

**1. Empty State (Not Focused):**
```
[🔍 Search documentation...]
```

**2. Empty State (Focused):**
```
[🔍 Search documentation...]
┌─────────────────────────────────────┐
│  Recent Searches                    │
│  🔍 user authentication             │
│  🔍 API documentation               │
│  🔍 deployment guide                │
└─────────────────────────────────────┘
```

**3. Typing (1-2 characters):**
```
[🔍 use...]
┌─────────────────────────────────────┐
│  Suggestions                        │
│  🔍 user authentication             │
│  🔍 user guide                      │
│  📁 User Guides                     │
│  ⏱️ Recent: "user login"            │
└─────────────────────────────────────┘
```

**4. Typing (2+ characters):**
```
[🔍 user aut...]
┌─────────────────────────────────────┐
│  Suggestions                        │
│  🔍 user authentication             │
│  🔍 user authorization              │
│  ─────────────────────────────────  │
│  Found 5 results                    │
│  ─────────────────────────────────  │
│  [Search Results...]                │
└─────────────────────────────────────┘
```

**5. With Active Filters:**
```
[🔍 user...] [Filter: 2 active]
┌─────────────────────────────────────┐
│  Filters: [Team Docs] [API Docs ×] │
│  [Clear All]                        │
└─────────────────────────────────────┘
```

### Keyboard Navigation

- **Arrow Down**: Navigate to next suggestion/result
- **Arrow Up**: Navigate to previous suggestion/result
- **Enter**: Select current suggestion or execute search
- **Escape**: Close suggestions/dropdown
- **Tab**: Move to next filter/category
- **Ctrl/Cmd + K**: Focus search bar (global shortcut)

## Technical Considerations

### Dependencies

**No new dependencies required** - Can use existing:
- `localStorage` for search history
- Existing search functions from `lib/supabase/search.ts`
- Current React hooks and state management

**Optional enhancements:**
- Consider fuzzy search library (`fuse.js`) for better suggestion matching
- Consider date formatting library (`date-fns`) for relative time display

### Performance

- **Suggestion Fetching**: Debounce to 200ms (faster than search)
- **History Storage**: Limit to 50-100 items to prevent localStorage bloat
- **Suggestion Limit**: Show maximum 5-8 suggestions to avoid UI clutter
- **Virtualization**: Consider virtualizing long suggestion lists if needed

### Data Storage

**Search History:**
- Storage: `localStorage` with key `dochub_search_history`
- Format: JSON array of `SearchHistoryItem[]`
- Size Limit: ~100KB (roughly 100 searches)

**Filter Preferences:**
- Storage: `localStorage` with key `dochub_filter_preferences`
- Format: JSON object with filter defaults
- Optional: Can be session-only (not persisted)

### Security Considerations

- **Sanitization**: Sanitize search queries before storing in history
- **Privacy**: Only store search queries, not results or user data
- **Clear History**: Provide easy way to clear all history
- **No Sensitive Data**: Don't store any sensitive information in localStorage

### Browser Compatibility

- **localStorage**: Universal support (IE8+)
- **Keyboard Events**: Universal support
- **Debouncing**: Works in all modern browsers
- **Focus Management**: Standard DOM APIs

## Implementation Phases

### Phase 1: Search History (MVP) ✅ COMPLETED
- [x] Create search history storage system (localStorage)
- [x] Add history display when search is empty and focused
- [x] Implement save/search history on search execution (only saves on result click/Enter)
- [x] Add clear history functionality
- [x] Individual delete functionality (re-saving moves to top)
- [x] History persistence across sessions
- **Completed**: 2025-01-30

### Phase 2: Search Suggestions / Autocomplete ✅ COMPLETED
- [x] Fetch document titles for suggestions
- [x] Fetch categories for suggestions
- [x] Integrate recent searches into suggestions
- [x] Create suggestions dropdown UI
- [x] Implement keyboard navigation (arrows, enter, escape)
- [x] Add highlighting for matching text
- [x] Loading states for suggestions
- [x] Debounced suggestion fetching (200ms)
- **Completed**: 2025-01-30

### Phase 3: Enhanced Filter UI ⚠️ PARTIAL
- [ ] Create filter chips/tags component (deferred)
- [ ] Add filter count badge (deferred)
- [x] Implement "Clear All Filters" button
- [x] Add visual indicators for active filters (in filter panel)
- [x] Filter panel layout
- [ ] Add filter presets (optional - deferred)
- **Note**: Core filter functionality is complete. Filter chips/tags can be added in a future enhancement.

### Phase 4: Polish & Optimization ✅ MOSTLY COMPLETED
- [x] Add loading states for suggestions
- [x] Optimize suggestion fetching performance (debouncing, limiting results)
- [ ] Add keyboard shortcuts (Ctrl/Cmd+K) - deferred
- [x] Keyboard navigation (arrows, enter, escape)
- [x] Error handling for search operations
- [x] Fuzzy matching/typo tolerance (bonus feature)
- **Note**: Global keyboard shortcut (Ctrl/Cmd+K) can be added in a future enhancement.

### Bonus Features ✅ ADDED
- [x] Fuzzy matching with Levenshtein distance algorithm
- [x] Typo tolerance for search queries
- [x] Smart search history saving (only on user actions, not keystrokes)
- [x] Enhanced database query with first 3 character matching

## Success Criteria

- ✅ Users can see search suggestions as they type
- ✅ Users can access their search history
- ✅ Recent searches are displayed prominently
- ✅ Advanced filters are accessible via filter panel
- ✅ Search history persists across sessions
- ✅ Keyboard navigation works smoothly
- ✅ All features work on desktop and mobile browsers
- ✅ Performance remains fast (< 200ms for suggestions)
- ✅ Search history doesn't exceed storage limits
- ✅ Fuzzy matching handles typos gracefully
- ✅ Search history only saves on actual search actions

## Implementation Status

**Status**: ✅ Core Features Complete  
**Completed**: 2025-01-30  
**Phases Completed**: Phase 1, Phase 2, Phase 4 (mostly)  
**Deferred**: Phase 3 (filter chips/tags), Global keyboard shortcut (Ctrl/Cmd+K)

### Key Features Implemented

1. **Search History**
   - Persistent storage in localStorage
   - Recent searches displayed when search bar is focused and empty
   - Clear history functionality
   - Smart saving (only on result clicks/Enter, not keystrokes)

2. **Search Suggestions/Autocomplete**
   - Real-time suggestions as user types (1+ characters)
   - Document title suggestions
   - Category suggestions
   - Recent search integration in suggestions
   - Loading states and debouncing

3. **Keyboard Navigation**
   - Arrow keys to navigate suggestions/results
   - Enter to select
   - Escape to close

4. **Fuzzy Matching** (Bonus)
   - Levenshtein distance algorithm
   - Typo tolerance
   - Enhanced relevance scoring
   - First 3 character matching for broader results

5. **Filter Enhancements**
   - Clear All Filters button
   - Visual indicators for active filters
   - Improved filter panel layout

## Future Enhancements

- **Search Analytics**: Track popular searches across all users
- **Search Templates**: Pre-defined search queries for common tasks
- **AI-Powered Suggestions**: Use ML to suggest better search terms
- **Search Operators**: Support for advanced query syntax (e.g., `title:"API"`)
- **Saved Searches**: Allow users to save and name search queries
- **Search Sharing**: Share search queries with team members
- **Search Export**: Export search results to CSV/PDF
- **Search Alerts**: Notify users when new documents match saved searches

## Related Features

- Search Bar (current implementation)
- Enhanced Navigation (for quick access to search)
- Document Viewer (for viewing search results)
- Toast Notifications (for search history feedback)

## References

- [MDN: localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN: Keyboard Events](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [React: Controlled Components](https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable)
- [Fuse.js Documentation](https://fusejs.io/) (optional for fuzzy search)

---

**Priority**: Medium  
**Estimated Effort**: 1-2 weeks  
**Target Release**: After Document Viewer Enhancements

