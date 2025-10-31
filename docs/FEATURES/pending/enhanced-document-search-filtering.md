# Enhanced Document Search and Filtering

## Overview

This feature request outlines improvements to the document search and filtering system to make it more powerful, flexible, and user-friendly. The enhancements will include advanced search operators, tag-based filtering, saved searches, improved relevance ranking, and better result presentation.

## Goals

- Provide advanced search capabilities with operators (AND, OR, NOT, exact phrases)
- Enable document tagging system for better organization and filtering
- Allow users to save frequently used searches
- Improve search result relevance and ranking
- Add additional filtering options (date range, author, tags)
- Enhance search result presentation with better metadata
- Improve performance for large document collections

## User Stories

### As a user, I want to...

1. **Use advanced search operators** so I can create precise queries (e.g., "authentication AND API NOT deprecated")
2. **Search for exact phrases** using quotes so I can find specific text sequences
3. **Filter documents by tags** so I can quickly find related documents
4. **Save my frequently used searches** so I can quickly access them later
5. **Filter by date range** so I can find recently updated or historical documents
6. **Sort search results** by relevance, date, or title so I can find what I need faster
7. **See document previews in search results** so I can verify relevance before opening
8. **Filter by author/editor** so I can find documents by specific team members
9. **Use keyboard shortcuts** for common search operations to improve efficiency
10. **See search result analytics** (total matches, search time) to understand result quality

## Current State

### Existing Search Functionality ✅

- Basic text search across title, category, and content
- Fuzzy matching with typo tolerance
- Search suggestions and autocomplete
- Recent search history (localStorage)
- Filters: Application, Category, Document Type (base/team)
- Search results grouped by type (documents, applications, groups)
- Relevance scoring based on match position
- Highlight matching text in results

### Limitations

- ❌ No advanced search operators (AND, OR, NOT, quotes)
- ❌ No document tagging system
- ❌ No saved searches functionality
- ❌ Limited sorting options (only by relevance)
- ❌ No date range filtering
- ❌ No author/editor filtering
- ❌ No full-text search index (PostgreSQL full-text search)
- ❌ No search result preview/snippet enhancement
- ❌ Limited result metadata display
- ❌ No search analytics or performance metrics

## Proposed Features

### 1. Advanced Search Operators

Enable users to create complex search queries using logical operators and exact phrase matching.

#### Features
- **AND operator** (default behavior): `authentication API` or `authentication AND API`
- **OR operator**: `authentication OR authorization`
- **NOT operator**: `authentication NOT deprecated`
- **Exact phrase matching**: `"single sign on"` (quoted strings)
- **Grouping with parentheses**: `(authentication OR auth) AND API`
- **Field-specific search**: `title:API`, `category:security`, `content:authentication`
- **Wildcards**: `auth*` for prefix matching (future enhancement)

#### UI Design

**Search Bar with Query Builder:**
```
┌─────────────────────────────────────────────────────────┐
│  Search: "authentication" AND (API OR endpoint) NOT old │
│  [Search] [Advanced] [Saved Searches ▼]                  │
└─────────────────────────────────────────────────────────┘
```

**Advanced Search Panel:**
```
┌─────────────────────────────────────────────────────────┐
│  Advanced Search                                 [Close] │
├─────────────────────────────────────────────────────────┤
│  Query Builder:                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [Contains: authentication]                          │ │
│  │   AND                                                │ │
│  │ [Contains: API] OR [Contains: endpoint]            │ │
│  │   NOT                                                │ │
│  │ [Contains: old]                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Quick Operators:                                        │
│  [ AND ] [ OR ] [ NOT ] [ "Exact Phrase" ]              │
│                                                          │
│  Field Search:                                           │
│  Title: [________] Category: [________]                  │
│  Content: [________] Tags: [________]                    │
└─────────────────────────────────────────────────────────┘
```

#### Technical Requirements
- Query parser to handle operators and syntax
- Tokenization of search query
- Boolean logic evaluation
- Field-specific search indexing
- Query validation and error handling
- Help tooltip explaining operators

#### Implementation Details
```typescript
interface SearchQuery {
  terms: SearchTerm[];
  operators: ('AND' | 'OR' | 'NOT')[];
  exactPhrases: string[];
  fieldFilters: {
    title?: string;
    category?: string;
    content?: string;
    tags?: string[];
  };
}

interface SearchTerm {
  text: string;
  field?: 'title' | 'category' | 'content' | 'tags' | 'all';
  operator?: 'AND' | 'OR' | 'NOT';
  exact?: boolean;
}

function parseSearchQuery(query: string): SearchQuery {
  // Parse query string into structured query object
  // Handle operators, quotes, field prefixes, etc.
}
```

### 2. Document Tagging System

Add a tagging system to documents for better organization and filtering.

#### Features
- **Add tags to documents**: During creation/editing
- **Tag suggestions**: Auto-suggest existing tags
- **Tag filtering**: Filter search results by tags
- **Tag management**: Create, edit, delete tags (admin)
- **Tag display**: Show tags in document cards and search results
- **Popular tags**: Display most-used tags

#### UI Design

**Tag Selection in Document Form:**
```
┌─────────────────────────────────────────┐
│  Tags                                    │
│  ┌─────────┬─────────┬─────────┐        │
│  │ API     │ [×]     │ auth    │ [×]    │
│  └─────────┴─────────┴─────────┘        │
│  [Add Tag...]                            │
│  Suggestions: api, authentication, ...   │
└─────────────────────────────────────────┘
```

**Tag Filter in Search:**
```
┌─────────────────────────────────────────┐
│  Filter by Tags                          │
│  ┌─────────┬─────────┬─────────┐        │
│  │ [✓] API │ [ ] Auth│ [ ] Docs│        │
│  └─────────┴─────────┴─────────┘        │
│  Show: [All Tags] ▼                      │
└─────────────────────────────────────────┘
```

#### Technical Requirements
- Database schema: `tags` table and `document_tags` junction table
- Tag autocomplete component
- Tag filtering in search queries
- Tag management UI (admin)
- Tag validation (lowercase, alphanumeric + hyphens)

#### Database Schema Updates
```sql
-- Create tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT, -- Optional color for tag display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_tags junction table
CREATE TABLE document_tags (
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('base', 'team')),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (document_id, document_type, tag_id)
);

-- Add indexes
CREATE INDEX idx_document_tags_document ON document_tags(document_id, document_type);
CREATE INDEX idx_document_tags_tag ON document_tags(tag_id);
CREATE INDEX idx_tags_slug ON tags(slug);

-- Add RLS policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- Policies for tags (read-only for authenticated users, admin can manage)
CREATE POLICY "Users can view tags"
ON tags FOR SELECT
TO authenticated
USING (true);

-- Policies for document_tags
CREATE POLICY "Users can view document tags"
ON document_tags FOR SELECT
TO authenticated
USING (true);
```

### 3. Saved Searches

Allow users to save frequently used search queries for quick access.

#### Features
- **Save search query**: Save current search with name and filters
- **Saved searches list**: Quick access to saved searches
- **Edit saved searches**: Update query or name
- **Delete saved searches**: Remove unused searches
- **Share saved searches**: Share search URLs (future)
- **Recent saved searches**: Quick access to recently used saves

#### UI Design

**Saved Searches Dropdown:**
```
┌─────────────────────────────────────────┐
│  Saved Searches                 [Manage] │
├─────────────────────────────────────────┤
│  📌 API Documentation                    │
│  📌 Security Guidelines                  │
│  📌 Recently Updated                     │
│  ────────────────────────────────────── │
│  [+ Save Current Search]                 │
└─────────────────────────────────────────┘
```

**Save Search Dialog:**
```
┌─────────────────────────────────────────┐
│  Save Search                      [X]   │
├─────────────────────────────────────────┤
│  Name: [API Documentation___________]   │
│                                          │
│  Query: authentication AND API          │
│  Filters:                                │
│  • Application: Customer Portal         │
│  • Category: API Reference              │
│                                          │
│  [Cancel]  [Save Search]                │
└─────────────────────────────────────────┘
```

#### Technical Requirements
- Database schema: `saved_searches` table
- UI component for saved searches management
- Load and execute saved searches
- Validation for search query and name

#### Database Schema Updates
```sql
-- Create saved_searches table
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB, -- Store search filters as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

-- Add indexes
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_last_used ON saved_searches(user_id, last_used_at DESC);

-- Add RLS policies
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved searches"
ON saved_searches FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create saved searches"
ON saved_searches FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved searches"
ON saved_searches FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved searches"
ON saved_searches FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 4. Enhanced Filtering Options

Add more filtering options to help users narrow down search results.

#### Features
- **Date Range Filter**: Filter by creation date, update date, or both
- **Author/Editor Filter**: Filter by document creator or last editor
- **Tag Filter**: Filter by one or more tags (see Tagging System above)
- **Application Group Filter**: Filter by application group
- **Document Status Filter**: Filter by status (draft, published, archived) - future
- **Content Type Filter**: Filter by file type (markdown, HTML, PDF) - future

#### UI Design

**Enhanced Filters Panel:**
```
┌─────────────────────────────────────────┐
│  Filters                         [Clear]│
├─────────────────────────────────────────┤
│  Application                             │
│  [Customer Portal ▼]                     │
│                                          │
│  Category                                │
│  [API Reference ▼]                      │
│                                          │
│  Tags                                    │
│  [Select tags... ▼]                     │
│                                          │
│  Date Range                              │
│  Updated: [Last 7 days ▼]               │
│    or: [Start Date] [End Date]          │
│                                          │
│  Author                                  │
│  [Select author... ▼]                   │
│                                          │
│  Document Type                           │
│  ○ All  ● Base  ○ Team                  │
│                                          │
│  Sort By                                 │
│  [Relevance ▼]                          │
│  • Relevance                             │
│  • Most Recent                           │
│  • Oldest First                          │
│  • Title A-Z                             │
│  • Title Z-A                             │
└─────────────────────────────────────────┘
```

#### Technical Requirements
- Date range picker component
- User/author lookup and filter
- Tag multi-select component
- Sorting implementation for all sort options
- Filter persistence in URL query params

### 5. Improved Search Result Presentation

Enhance how search results are displayed to provide more context and better usability.

#### Features
- **Enhanced snippets**: Show better content previews with more context around matches
- **Result metadata**: Display more metadata (author, creation date, view count)
- **Result grouping**: Group results by application, category, or date
- **Infinite scroll or pagination**: Handle large result sets
- **Result preview**: Quick preview modal without navigation
- **Breadcrumb navigation**: Show document location in results
- **Highlight improvements**: Better highlighting of matched terms

#### UI Design

**Enhanced Search Results:**
```
┌─────────────────────────────────────────────────────────┐
│  Found 42 results for "authentication"          [Export]│
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │ API Authentication Guide                  [Preview] │ │
│  │ Customer Portal > API Reference • Updated 2h ago    │ │
│  │                                                    │ │
│  │ ...guide to implement authentication using our     │ │
│  │ API. The authentication process involves...        │ │
│  │                                                    │ │
│  │ Tags: [API] [Auth] [Security]                      │ │
│  │ Author: John Doe • Views: 124                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ OAuth 2.0 Implementation                            │ │
│  │ Admin Dashboard > Security • Updated 1d ago        │ │
│  │ ...                                                 │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Technical Requirements
- Enhanced snippet extraction algorithm
- Metadata queries (author, dates, view counts)
- Preview modal component
- Result grouping logic
- Pagination or infinite scroll implementation

### 6. Search Analytics and Performance

Track search performance and provide analytics to users.

#### Features
- **Search metrics**: Result count, search time
- **Performance indicators**: Query execution time
- **Search suggestions**: "Did you mean..." for typos
- **Popular searches**: Show trending searches (admin)
- **Search history analytics**: Track frequently searched terms

#### UI Design

**Search Metrics Display:**
```
┌─────────────────────────────────────────┐
│  Found 42 results in 0.12s              │
│  Showing results 1-20 of 42             │
│                                          │
│  Did you mean: "authentication"?          │
└─────────────────────────────────────────┘
```

#### Technical Requirements
- Performance timing for search operations
- Typo detection and suggestions
- Analytics tracking (optional, privacy-conscious)

### 7. Full-Text Search Enhancement

Improve search quality using PostgreSQL full-text search capabilities.

#### Features
- **PostgreSQL full-text search**: Use built-in FTS for better performance
- **Search index**: Create GIN indexes for faster searching
- **Ranking**: Use PostgreSQL ranking functions (ts_rank, ts_rank_cd)
- **Language support**: Support for multiple languages (stemming)
- **Weighted search**: Weight title matches higher than content

#### Technical Requirements
- Database migration to add full-text search columns
- GIN index creation for search vectors
- Query adaptation to use full-text search
- Fallback to current ILIKE search for compatibility

#### Database Schema Updates
```sql
-- Add full-text search vectors to base_documents
ALTER TABLE base_documents
ADD COLUMN search_vector tsvector;

-- Add full-text search vectors to team_documents
ALTER TABLE team_documents
ADD COLUMN search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_base_documents_search_vector
BEFORE INSERT OR UPDATE ON base_documents
FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

CREATE TRIGGER update_team_documents_search_vector
BEFORE INSERT OR UPDATE ON team_documents
FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

-- Create GIN indexes for fast full-text search
CREATE INDEX idx_base_documents_search_vector ON base_documents USING GIN(search_vector);
CREATE INDEX idx_team_documents_search_vector ON team_documents USING GIN(search_vector);

-- Update existing documents
UPDATE base_documents SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'C');

UPDATE team_documents SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'C');
```

## Technical Considerations

### Dependencies

**New Dependencies:**
- Query parser library (e.g., custom parser or `query-string` for URL params)
- Date picker library (e.g., `react-datepicker`)
- Tag input component (e.g., `react-tag-autocomplete` or custom)

**Existing Dependencies:**
- Supabase client (database operations)
- React hooks (state management)
- Lucide React (icons)

### Performance

- **Indexing**: Ensure proper database indexes for all filterable fields
- **Query Optimization**: Use efficient queries, limit result sets
- **Caching**: Cache popular searches or filter options
- **Debouncing**: Already implemented for search input
- **Lazy Loading**: Load results incrementally if needed

### Database Schema

**New Tables:**
- `tags` - Document tags
- `document_tags` - Document-tag relationships
- `saved_searches` - User saved searches

**Modified Tables:**
- `base_documents` - Add `search_vector`, `author_id`, `editor_id` (optional)
- `team_documents` - Add `search_vector`, `author_id`, `editor_id` (optional)

### Backward Compatibility

- Maintain existing search functionality as fallback
- Ensure existing filters continue to work
- Preserve search history format
- Support migration of existing documents to new tagging system

### Error Handling

- Validate search queries and show helpful error messages
- Handle database errors gracefully
- Show loading states during search operations
- Provide fallback when advanced features fail

## Implementation Phases

### Phase 1: Foundation (MVP)
- [ ] Implement document tagging system (database + UI)
- [ ] Add tag filtering to search
- [ ] Enhance search result presentation with better snippets
- [ ] Add sorting options (relevance, date, title)

### Phase 2: Advanced Search (High Priority)
- [ ] Implement basic search operators (AND, OR, NOT)
- [ ] Add exact phrase matching (quotes)
- [ ] Implement field-specific search (title:, category:, etc.)
- [ ] Add query parser and validation

### Phase 3: Saved Searches
- [ ] Create saved searches database schema
- [ ] Implement save/load/edit/delete saved searches
- [ ] Add saved searches UI component
- [ ] Add saved searches to search bar

### Phase 4: Enhanced Filtering
- [ ] Add date range filter
- [ ] Add author/editor filter
- [ ] Enhance filter panel UI
- [ ] Add filter persistence in URL

### Phase 5: Full-Text Search Enhancement
- [ ] Implement PostgreSQL full-text search
- [ ] Create search vector columns and indexes
- [ ] Migrate search queries to use FTS
- [ ] Performance testing and optimization

### Phase 6: Polish and Analytics
- [ ] Add search analytics display
- [ ] Implement "Did you mean" suggestions
- [ ] Add keyboard shortcuts
- [ ] Performance optimization
- [ ] Accessibility improvements

## Success Criteria

- [ ] Users can create complex searches using operators
- [ ] Users can tag documents and filter by tags
- [ ] Users can save and quickly access frequent searches
- [ ] Search results are more relevant and better presented
- [ ] Additional filtering options are available and functional
- [ ] Full-text search improves search performance
- [ ] All features work with existing search functionality
- [ ] UI is intuitive and accessible
- [ ] Performance remains good with large document collections

## Future Enhancements

- **Search as you type**: Real-time search results while typing
- **Voice search**: Voice input for search queries
- **AI-powered search**: Semantic search using embeddings
- **Search templates**: Pre-defined search templates for common queries
- **Search export**: Export search results to CSV/PDF
- **Collaborative filters**: Share filter sets with team
- **Search notifications**: Notify users when new documents match saved searches
- **Advanced analytics**: Search trends, popular queries, search effectiveness

## Related Features

- Document Management (documents need tags)
- Application Management (application group filtering)
- User Profile (author/editor filtering)
- Document Viewer (tag display and editing)

## References

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Supabase Full-Text Search Guide](https://supabase.com/docs/guides/database/full-text-search)
- [Search UX Best Practices](https://www.nngroup.com/articles/search-visible-and-simple/)
- [Boolean Search Operators](https://en.wikipedia.org/wiki/Boolean_algebra)

---

**Priority**: High  
**Estimated Effort**: 3-4 weeks  
**Target Release**: After Document Management improvements  
**Status**: 📋 Pending

