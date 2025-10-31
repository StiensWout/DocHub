# Search & Discovery

**Status**: ✅ Complete (Enhanced features in progress)  
**Last Updated**: 2025-01-30

---

## Overview

DocHub provides comprehensive search functionality with real-time results, advanced filtering, search suggestions, and search history.

---

## Core Features

### ✅ Real-Time Search

- **Debounced Search**: 300ms debounce for performance
- **Minimum Characters**: 2 characters required to search
- **Live Results**: Results update as you type
- **Multi-Type Search**: Searches applications, groups, and documents simultaneously

### ✅ Search Suggestions & Autocomplete

- **Title Suggestions**: Suggestions based on document titles
- **Category Suggestions**: Suggestions based on document categories
- **Application Suggestions**: Suggestions based on application names
- **Autocomplete**: Shows suggestions as you type (1+ characters)
- **Keyboard Navigation**: Arrow keys to navigate suggestions

### ✅ Search History

- **Recent Searches**: Access to recent search queries
- **Local Storage**: Search history stored in browser
- **Quick Re-search**: Click to re-run previous searches
- **Search Stats**: Shows result count for each search
- **Time Stamps**: Displays when searches were performed

### ✅ Advanced Filtering

**Filter Options**:
- **Application**: Filter by specific application
- **Category**: Filter by document category
- **Document Type**: Filter base or team documents
- **Tags**: Filter by multiple tags (AND logic)
- **Result Type**: Filter by applications, groups, or documents

**Filter UI**:
- Toggleable filter panel
- Clear all filters button
- Active filter indicators
- Filter persistence across sessions

### ✅ Search Results

**Result Types**:
- **Applications**: Matching applications with document counts
- **Groups**: Matching application groups with app counts
- **Documents**: Matching documents with metadata

**Result Display**:
- Highlighted search terms
- Result snippets
- Metadata display (category, date, etc.)
- Type badges (shared/team documents)
- Keyboard navigation support

### ✅ Enhanced Features (In Progress)

- **Tag Filtering**: ✅ Complete
- **Advanced Search Operators**: Pending
- **Saved Searches**: Pending
- **Sorting Options**: Pending
- **Better Snippets**: Pending

---

## Search Functionality

### Search Scope

Searches across:
- **Document Titles**: Exact and partial matches
- **Document Content**: Full-text search
- **Application Names**: Application matching
- **Group Names**: Application group matching
- **Categories**: Category matching

### Search Algorithm

- **Relevance Scoring**: Results sorted by relevance
- **Exact Matches**: Prioritized over partial matches
- **Starts With**: Prioritized over contains
- **Case Insensitive**: Case-insensitive matching

---

## Keyboard Shortcuts

- **Arrow Keys**: Navigate suggestions/results
- **Enter**: Select highlighted item
- **Escape**: Close suggestions/results
- **Backspace**: Remove last tag (when input empty)

---

## Components

- `SearchBar` - Main search component
- `TagSelector` - Tag filtering in search
- Search suggestion dropdown
- Search results display
- Filter panel

---

## API Endpoints

- `GET /api/search` - Search endpoint (if implemented)
- Search functions: `lib/supabase/search.ts`

---

## Related Documentation

- [Document Management](DOCUMENTS.md)
- [Enhanced Search Feature Request](pending/enhanced-document-search-filtering.md)

