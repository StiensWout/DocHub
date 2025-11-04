# Project TODO List

**Last Updated:** December 2024  
**Status:** 📋 Active Development  
**GitHub Issues:** [View Bugs](https://github.com/StiensWout/DLWait/issues)  
**GitHub Projects:** [View Project Board](https://github.com/StiensWout/DLWait/projects)

## 📋 Overview

This TODO list covers features, optimizations, infrastructure improvements, rebranding tasks, and all non-bug development work. 

**Bug Tracking:** All bugs are tracked in [GitHub Issues](https://github.com/StiensWout/DLWait/issues).  
**Task Management:** Tasks can be synced to [GitHub Projects](https://github.com/StiensWout/DLWait/projects) - see [GitHub Projects Sync Guide](./GITHUB_PROJECTS_SYNC.md).

## 🔗 Related Files

- [GitHub Projects Sync Guide](./GITHUB_PROJECTS_SYNC.md) - How to sync tasks to GitHub Projects
- [README.md](./README.md) - Project management overview
- [BUG_LIST.md](./BUG_LIST.md) - Historical bug list (archived)
- [BUG_REPORTS.md](./BUG_REPORTS.md) - Historical bug reports (archived)

## 📋 Table of Contents

- [🏗️ Infrastructure & DevOps](#️-infrastructure--devops)
- [🎨 Rebranding & Migration](#-rebranding--migration)
- [⚡ Performance Optimizations](#-performance-optimizations)
- [🧪 Testing](#-testing-checklist)
- [📊 Progress Tracking](#-progress-tracking)

---

## 🏗️ INFRASTRUCTURE & DEVOPS

### Task #1: Upgrade Framework/Packages to Latest Versions
**Priority:** 🟡 MEDIUM
**Category:** Infrastructure / Security
**Files:** `package.json`, All dependencies

- [ ] Audit current package versions:
  - [ ] Review all dependencies in `package.json`
  - [ ] Check for security vulnerabilities (`npm audit`)
  - [ ] Identify packages with major version updates available
- [ ] Create upgrade plan:
  - [ ] Group packages by update complexity (major/minor/patch)
  - [ ] Identify breaking changes in major updates
  - [ ] Plan testing strategy for each upgrade
- [ ] Upgrade packages incrementally:
  - [ ] Start with patch updates (lowest risk)
  - [ ] Then minor updates (moderate risk)
  - [ ] Finally major updates (requires testing)
- [ ] Critical packages to review:
  - [ ] Next.js (currently ^14.2.0)
  - [ ] React & React-DOM (currently ^18.3.0)
  - [ ] TypeScript (currently ^5.5.0)
  - [ ] @workos-inc/node (currently ^7.72.1)
  - [ ] @supabase/supabase-js (currently ^2.39.0)
  - [ ] Winston (currently ^3.18.3)
- [ ] Ensure stable user experience after upgrade:
  - [ ] Test all major features after each upgrade
  - [ ] Verify authentication flow
  - [ ] Verify file upload/download
  - [ ] Verify document editing
  - [ ] Check for breaking changes in dependencies
- [ ] Update documentation:
  - [ ] Document version changes in CHANGELOG
  - [ ] Update README with new requirements

**Estimated Time:** 4-6 hours
**Risk Level:** Medium - Requires thorough testing

---

### Task #2: Database Installation/Upgrade/Migration Flow
**Priority:** 🟡 MEDIUM
**Category:** Infrastructure / DevOps
**Files:** `scripts/`, Database schema files

- [ ] Create fresh database installation script:
  - [ ] Script to create all tables from scratch
  - [ ] Script to insert initial seed data
  - [ ] Script to set up indexes and constraints
  - [ ] Document required environment variables
- [ ] Create database validation script:
  - [ ] Script to check current database schema version
  - [ ] Compare current schema with expected schema
  - [ ] Identify missing tables, columns, indexes
  - [ ] Generate migration plan
- [ ] Create migration system:
  - [ ] Script to dynamically validate database schema
  - [ ] Auto-detect required changes for new version
  - [ ] Apply migrations incrementally
  - [ ] Rollback capability for failed migrations
  - [ ] Migration logging/tracking
- [ ] Investigate alternative database types:
  - [ ] Research PostgreSQL alternatives (if applicable)
  - [ ] Assess compatibility with Supabase
  - [ ] Evaluate migration effort
  - [ ] Document findings

**Estimated Time:** 6-8 hours
**Risk Level:** Medium - Critical for deployment

---

### Task #3: Versioning System Implementation
**Priority:** 🟡 MEDIUM
**Category:** Infrastructure / DevOps
**Files:** `package.json`, Version display component, CI/CD configs

- [ ] Set up semantic versioning:
  - [ ] Define version format (SemVer: MAJOR.MINOR.PATCH)
  - [ ] Initialize version in `package.json` (currently 0.1.0)
  - [ ] Create versioning strategy document
- [ ] Display version in application:
  - [ ] Add version component to UI (footer or debug panel)
  - [ ] Display version in admin/settings area
  - [ ] Include version in API responses (optional)
  - [ ] Make version easily accessible for debugging
- [ ] Implement release management:
  - [ ] Create release workflow/process
  - [ ] Combine features/sprints into versioned releases
  - [ ] Set priority list for version releases
  - [ ] Create CHANGELOG.md with version history
- [ ] Deployment improvements:
  - [ ] Document production deployment process
  - [ ] Create deployment scripts/automation
  - [ ] Set up environment-specific configurations
  - [ ] Create rollback procedures
  - [ ] Document staging/production workflow

**Estimated Time:** 4-6 hours
**Risk Level:** Low

---

## 🎨 REBRANDING & MIGRATION

### Task #4: GitHub Migration - DLWait to DocHub Rebranding
**Priority:** 🟠 HIGH (Before public release)
**Category:** Rebranding / Migration
**Files:** All files (global search/replace), GitHub settings, Local directory

- [ ] Prepare for GitHub repository migration:
  - [ ] Audit all references to "DLWait" / "dlwait" in codebase
  - [ ] Create migration checklist
  - [ ] Document all locations that need updating
- [ ] Update codebase branding:
  - [ ] Replace "dlwait" with "dochub" in package.json
  - [ ] Update all file references
  - [ ] Update all string references in code
  - [ ] Update environment variable names if needed
  - [ ] Update documentation and README
- [ ] Update GitHub repository:
  - [ ] Rename repository from dlwait to dochub (or create new repo)
  - [ ] Update repository description
  - [ ] Update repository topics/tags
  - [ ] Update GitHub Pages if applicable
  - [ ] Update webhook URLs if any
- [ ] Local directory migration:
  - [ ] Create migration script for local directory rename
  - [ ] Update all absolute path references
  - [ ] Update git remote URLs
  - [ ] Update local development setup instructions
- [ ] Update external references:
  - [ ] Update CI/CD pipeline references
  - [ ] Update deployment scripts
  - [ ] Update documentation sites
  - [ ] Update any external integrations

**Estimated Time:** 2-4 hours
**Risk Level:** Medium - Requires careful coordination

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### Perf #1: React Component Optimization
**Files:** `components/*.tsx`

- [ ] Audit components for unnecessary re-renders
- [ ] Add `React.memo()` to expensive components:
  - [ ] `DocumentViewer.tsx`
  - [ ] `DocumentEditor.tsx`
  - [ ] `FileViewer.tsx`
  - [ ] `ApplicationCard.tsx`
  - [ ] `Sidebar.tsx`
- [ ] Review `useCallback` usage (already has some, expand if needed):
  - [ ] Ensure all event handlers in frequently re-rendering components use `useCallback`
  - [ ] Verify dependencies are correct
- [ ] Review `useMemo` usage:
  - [ ] Add `useMemo` for expensive calculations
  - [ ] Memoize filtered/sorted arrays
  - [ ] Memoize complex derived state
- [ ] Profile component render times with React DevTools
- [ ] Optimize prop drilling (consider Context API for deeply nested props)

**Estimated Time:** 4-6 hours  
**Expected Impact:** 20-30% faster component renders

---

### Perf #2: Database Query Optimization
**Files:** `lib/auth/user-groups.ts`, `lib/workos/organizations.ts`, `lib/supabase/queries.ts`

- [ ] Profile slow queries using Supabase dashboard
- [ ] Identify and fix N+1 query problems:
  - [ ] `getUserGroups()` - batch organization queries
  - [ ] `getUserOrganizationMemberships()` - optimize enrichment
  - [ ] Document queries in loops
- [ ] Add database indexes for frequently queried columns:
  - [ ] `user_groups.user_id`
  - [ ] `user_groups.group_name`
  - [ ] `document_access_groups.group_name`
  - [ ] `document_files.document_id`
  - [ ] `document_files.application_id`
- [ ] Implement query result caching:
  - [ ] Cache user groups (already has membership cache, expand)
  - [ ] Cache application lists
  - [ ] Cache document metadata
  - [ ] Set appropriate TTL for cached data
- [ ] Use database joins instead of multiple sequential queries
- [ ] Add pagination to list queries (prevent loading all data)
- [ ] Use database indexes effectively (verify with EXPLAIN queries)

**Estimated Time:** 6-8 hours  
**Expected Impact:** 40-60% faster database operations

---

### Perf #3: API Response Optimization
**Files:** `app/api/**/*.ts`

- [ ] Implement response caching headers:
  - [ ] Static data: Cache-Control with long TTL
  - [ ] Dynamic data: Cache-Control with short TTL or no-cache
- [ ] Add pagination to list endpoints:
  - [ ] `/api/applications`
  - [ ] `/api/documents`
  - [ ] `/api/tags`
- [ ] Optimize API response payloads:
  - [ ] Remove unnecessary fields from responses
  - [ ] Use field selection in Supabase queries
  - [ ] Compress large JSON responses
- [ ] Implement API response compression (gzip/brotli)
- [ ] Add ETags for conditional requests
- [ ] Batch related API calls on frontend where possible

**Estimated Time:** 3-4 hours  
**Expected Impact:** 30-50% smaller payloads, faster API responses

---

### Perf #4: Image & Asset Optimization
**Files:** `components/*.tsx`, `next.config.mjs`

- [ ] Configure Next.js Image Optimization:
  - [ ] Use `next/image` for all images
  - [ ] Configure image domains in `next.config.mjs`
  - [ ] Set appropriate `sizes` prop
  - [ ] Enable lazy loading for below-fold images
- [ ] Optimize icon loading:
  - [ ] Tree-shake unused Lucide icons
  - [ ] Consider icon sprite or lazy loading icons
- [ ] Add WebP/AVIF format support for images
- [ ] Compress and optimize PDF/DOCX previews
- [ ] Implement progressive image loading

**Estimated Time:** 2-3 hours  
**Expected Impact:** 40-60% faster page loads

---

### Perf #5: Code Splitting & Lazy Loading
**Files:** `app/**/*.tsx`, `components/*.tsx`

- [ ] Implement route-based code splitting:
  - [ ] Lazy load document editor
  - [ ] Lazy load file viewer
  - [ ] Lazy load heavy components (Dialog, Modal)
- [ ] Use dynamic imports for large dependencies:
  - [ ] `react-pdf` (already heavy, ensure lazy loaded)
  - [ ] `docx-preview` (lazy load in FileViewer)
  - [ ] TipTap editor components
- [ ] Split vendor bundles (separate WorkOS, Supabase, TipTap bundles)
- [ ] Analyze bundle size with `@next/bundle-analyzer`
- [ ] Remove unused dependencies
- [ ] Optimize TipTap bundle (only import needed extensions)

**Estimated Time:** 3-4 hours  
**Expected Impact:** 30-50% smaller initial bundle, faster Time to Interactive

---

### Perf #6: Caching Strategy
**Files:** Multiple

- [ ] Implement server-side caching:
  - [ ] Cache WorkOS organization data
  - [ ] Cache user groups (already partially done, expand)
  - [ ] Cache application lists
  - [ ] Cache document metadata
- [ ] Add client-side caching:
  - [ ] Use React Query or SWR for data fetching
  - [ ] Implement stale-while-revalidate pattern
  - [ ] Cache search results
- [ ] Configure HTTP caching:
  - [ ] Static assets: long cache with versioning
  - [ ] API responses: appropriate cache headers
- [ ] Use service worker for offline support (optional)

**Estimated Time:** 4-5 hours  
**Expected Impact:** 50-70% reduction in API calls

---

### Perf #7: Search & Filtering Performance
**Files:** `lib/supabase/search.ts`, `components/SearchBar.tsx`

- [ ] Optimize search queries:
  - [ ] Add full-text search indexes
  - [ ] Use Supabase full-text search features
  - [ ] Implement search debouncing (if not already done)
- [ ] Optimize tag filtering:
  - [ ] Index tag columns
  - [ ] Cache tag lists
- [ ] Implement search result caching
- [ ] Limit search result count (pagination)
- [ ] Optimize search UI:
  - [ ] Virtualize long result lists
  - [ ] Debounce search input (verify current implementation)

**Estimated Time:** 2-3 hours  
**Expected Impact:** 50-80% faster searches

---

### Perf #8: File Upload/Download Optimization
**Files:** `app/api/files/**/*.ts`, `components/FileUploadButton.tsx`

- [ ] Implement chunked uploads for large files:
  - [ ] Use Supabase storage resumable uploads
  - [ ] Add progress tracking
  - [ ] Handle upload failures gracefully
- [ ] Optimize file preview loading:
  - [ ] Lazy load file previews
  - [ ] Show thumbnails for images
  - [ ] Stream large file downloads
- [ ] Add file compression where applicable
- [ ] Implement CDN for file serving (if using Supabase CDN)
- [ ] Cache file metadata queries

**Estimated Time:** 4-5 hours  
**Expected Impact:** Better UX for large file operations

---

### Perf #9: Bundle Size Optimization
**Files:** `next.config.mjs`, `package.json`

- [ ] Analyze bundle with `@next/bundle-analyzer`:
  - [ ] Run: `npm install @next/bundle-analyzer`
  - [ ] Configure in `next.config.mjs`
  - [ ] Identify large dependencies
- [ ] Optimize imports:
  - [ ] Use named imports instead of default
  - [ ] Remove unused imports
  - [ ] Tree-shake unused code
- [ ] Replace heavy dependencies:
  - [ ] Review if all TipTap extensions are needed
  - [ ] Check if lighter alternatives exist
- [ ] Enable Next.js production optimizations:
  - [ ] Minification (already enabled)
  - [ ] Tree shaking
  - [ ] Code splitting
- [ ] Set up bundle size budget limits in CI

**Estimated Time:** 2-3 hours  
**Expected Impact:** 20-40% smaller bundle size

---

### Perf #10: Network & API Call Optimization
**Files:** `lib/**/*.ts`, `app/api/**/*.ts`

- [ ] Reduce redundant API calls:
  - [ ] Batch WorkOS API calls where possible
  - [ ] Reuse fetched data (membership cache expansion)
  - [ ] Avoid duplicate Supabase queries
- [ ] Implement request deduplication:
  - [ ] Use request caching for identical queries
  - [ ] Deduplicate concurrent identical requests
- [ ] Optimize WorkOS API usage:
  - [ ] Batch organization membership queries
  - [ ] Cache organization data
  - [ ] Reduce unnecessary API calls
- [ ] Add connection pooling for database
- [ ] Implement GraphQL or batch endpoints (if needed)

**Estimated Time:** 3-4 hours  
**Expected Impact:** 30-50% reduction in API calls

---

### Perf #11: Memory & Resource Management
**Files:** Components with heavy resources

- [ ] Fix memory leaks:
  - [ ] Clean up event listeners
  - [ ] Clear intervals/timeouts
  - [ ] Unsubscribe from subscriptions
- [ ] Optimize PDF rendering:
  - [ ] Render PDF pages on-demand
  - [ ] Limit concurrent PDF renders
  - [ ] Dispose of PDF objects properly
- [ ] Optimize DOCX rendering:
  - [ ] Lazy render DOCX content
  - [ ] Dispose of docx-preview instances
- [ ] Optimize TipTap editor:
  - [ ] Dispose editor instances properly
  - [ ] Limit editor history size
- [ ] Profile memory usage with Chrome DevTools

**Estimated Time:** 2-3 hours  
**Expected Impact:** Reduced memory usage, fewer crashes

---

### Perf #12: Monitoring & Profiling
**Files:** All

- [ ] Set up performance monitoring:
  - [ ] Web Vitals tracking (Core Web Vitals)
  - [ ] Real User Monitoring (RUM)
  - [ ] API response time tracking
- [ ] Add performance profiling:
  - [ ] Lighthouse CI in deployment pipeline
  - [ ] Performance budgets
  - [ ] Regular performance audits
- [ ] Monitor database query performance:
  - [ ] Set up Supabase query monitoring
  - [ ] Track slow queries
  - [ ] Set up alerts for performance degradation
- [ ] Add performance logging:
  - [ ] Log slow API calls
  - [ ] Log slow database queries
  - [ ] Track render times

**Estimated Time:** 3-4 hours  
**Expected Impact:** Ongoing performance visibility

---

## 🧪 Testing Checklist

### Performance Optimizations
- [ ] Lighthouse score > 90 for all metrics
- [ ] Bundle size reduced by target %
- [ ] Database queries optimized
- [ ] API response times improved
- [ ] Memory leaks fixed
- [ ] Core Web Vitals within targets

---

## 🎯 Priority Order Recommendations

### Immediate Priority
1. Task #4: GitHub Migration/Rebranding (HIGH)

### Month 1
1. Task #1: Package Upgrades
2. Task #2: Database Migrations
3. Task #3: Versioning

### Month 2 (Performance Focus)
1. Perf #1 - React Component Optimization
2. Perf #2 - Database Query Optimization
3. Perf #3 - API Response Optimization
4. Perf #4 - Image & Asset Optimization

### Month 3 (Performance Continued)
5. Perf #5 - Code Splitting & Lazy Loading
6. Perf #6 - Caching Strategy
7. Perf #7 - Search & Filtering Performance
8. Perf #8 - File Upload/Download Optimization

### Month 4 (Performance & Polish)
9. Perf #9 - Bundle Size Optimization
10. Perf #10 - Network & API Call Optimization
11. Perf #11 - Memory & Resource Management
12. Perf #12 - Monitoring & Profiling

---

## 📊 Progress Tracking

### Infrastructure & DevOps Tasks
**Total Tasks:** 4
- **High Priority:** 1 task (Task #4: GitHub Migration/Rebranding)
- **Medium Priority:** 3 tasks (Task #1: Package Upgrades, Task #2: Database Migrations, Task #3: Versioning)

### Performance Optimizations
**Total Performance Items:** 12
- **React Optimization:** Component memoization, hooks optimization
- **Database:** Query optimization, indexing, caching
- **API:** Response optimization, pagination, compression
- **Assets:** Image optimization, lazy loading
- **Bundle:** Code splitting, tree shaking
- **Caching:** Multi-layer caching strategy
- **Search:** Full-text search optimization
- **Files:** Upload/download optimization
- **Network:** Request deduplication, batching
- **Memory:** Resource cleanup, leak fixes
- **Monitoring:** Performance tracking setup

### Time Estimates
- **Infrastructure & DevOps:** ~16-22 hours
- **Performance Optimizations:** ~35-45 hours
- **Total Estimated Time:** ~51-67 hours

### Progress Summary
- [ ] Infrastructure & DevOps tasks: 0/4
- [ ] Performance optimizations: 0/12
- [ ] Overall completion: 0/16 total tasks

### Key Metrics to Track
- **Before/After Lighthouse Scores:** TBD
- **Bundle Size Reduction:** TBD
- **API Response Time Improvement:** TBD
- **Database Query Time Reduction:** TBD
- **Memory Usage Reduction:** TBD

---

## 🎨 Code Quality Standards

### Before Marking Items Complete

Each item should meet these standards:

- [ ] **Code Review:** At least one other developer has reviewed
- [ ] **Tests Added:** Unit/integration tests cover the changes
- [ ] **Documentation:** Code is commented, JSDoc added where needed
- [ ] **Type Safety:** No new `any` types introduced
- [ ] **Performance:** No performance regressions (verify with profiling)
- [ ] **Linting:** No linting errors

- ✅ Code compiles without errors/warnings
- ✅ All relevant tests pass
- ✅ Manual testing completed
- ✅ Performance metrics documented (for perf items)
- ✅ Related documentation updated
- ✅ PR reviewed and approved

---

## 🛠️ Tools & Resources

### Development Tools
- **TypeScript:** `tsc --noEmit` for type checking
- **Linting:** ESLint configuration
- **Bundle Analysis:** `@next/bundle-analyzer`
- **Performance:** Chrome DevTools, Lighthouse, React DevTools

### Testing Tools
- **Unit Tests:** (Set up testing framework if not present)
- **E2E Tests:** Playwright or Cypress
- **API Tests:** Postman/Insomnia collections

### Monitoring Tools
- **Performance:** Lighthouse CI, Web Vitals
- **Errors:** Sentry or similar error tracking
- **Analytics:** User behavior tracking (optional)
## 📚 Documentation Updates Needed

When completing items, update:

- [ ] [../README.md](../README.md) - Feature changes, new requirements
- [ ] [../docs/CHANGELOG.md](../docs/CHANGELOG.md) - All changes logged
- [ ] API Documentation - Update endpoint docs if changed
- [ ] Environment Variables - Document new required vars

---

## 🔗 Related Files & Resources

### Project Management
- [GitHub Projects Sync Guide](./GITHUB_PROJECTS_SYNC.md) - How to sync tasks to GitHub Projects
- [README.md](./README.md) - Project management overview

### Historical Reference (Archived)
- [BUG_LIST.md](./BUG_LIST.md) - Historical bug list (bugs now in GitHub Issues)
- [BUG_REPORTS.md](./BUG_REPORTS.md) - Historical bug reports (bugs now in GitHub Issues)
- [BUG_FIX_REVIEW.md](./BUG_FIX_REVIEW.md) - Historical bug fix validation

### Project Documentation
- [../README.md](../README.md) - Project documentation
- [../docs/CHANGELOG.md](../docs/CHANGELOG.md) - Track changes made
- [../docs/ROADMAP.md](../docs/ROADMAP.md) - Future features

### External Links
- [GitHub Issues](https://github.com/StiensWout/DLWait/issues) - Bug tracking
- [GitHub Projects](https://github.com/StiensWout/DLWait/projects) - Project board

---

## 💡 Tips for Effective Completion

1. **Start with High Priority Items:** Infrastructure tasks first
2. **Batch Related Work:** Group similar optimizations together
3. **Measure Before/After:** Document performance improvements
4. **Test Thoroughly:** Verify optimizations work as expected
5. **Update as You Go:** Mark items complete immediately
6. **Code Review:** Get feedback early and often
7. **Small PRs:** Break large items into smaller, reviewable PRs

---

## 💡 Usage Tips

1. **Mark Progress:** Check off items `[x]` as you complete them
2. **Sync to GitHub:** Use [GitHub Projects Sync Guide](./GITHUB_PROJECTS_SYNC.md) to create issues for tasks
3. **Update Regularly:** Keep this file updated as you make progress
4. **Link Issues:** When creating GitHub issues, link back to the relevant TODO section

---

**Note:** Update this TODO list as you complete items. Mark items as `[x]` when done.  
**Last Updated:** December 2024  
**Next Review:** Schedule weekly progress reviews
