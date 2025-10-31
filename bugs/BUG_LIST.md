# Bug List and Potential Issues Report

**Generated:** $(date)
**Scope:** Full codebase analysis

## 🔴 CRITICAL ISSUES

_All critical issues have been resolved. See [ARCHIVED FIXES](#-archived-fixes---resolved) section below for details._

## 🟠 HIGH PRIORITY ISSUES

### 21. Document Type Change Lacks Transactional Integrity ✅ RESOLVED

**Severity:** HIGH
**Category:** Functionality / Data Integrity
**Status:** ✅ FIXED
**Files:** `components/DocumentMetadataEditor.tsx:70-130`

#### Issues:
- Document type change operation creates new document, copies tags, and deletes old document
- No transactional integrity - operations are not atomic
- Tag copying (line 117-121) uses `fetch()` with no error handling - failures are silently ignored
- Old document deletion (line 125) has no error checking - deletion failures are ignored
- Success toast shown (line 127) regardless of whether tag copying or deletion succeeded
- Can lead to data inconsistency: duplicate documents (if deletion fails) or data loss (old document deleted, new one missing tags)

#### Impact:
- **HIGH** - Can result in duplicate documents or data loss
- User sees success message but data may be corrupted
- No rollback mechanism if operations fail

#### Fix Applied:
- ✅ Added comprehensive error handling for tag copying operation (checks `response.ok`)
- ✅ Added error checking for old document deletion (checks `deleteError`)
- ✅ Implemented rollback mechanism:
  - If tag copying fails: Delete newly created document, keep old document intact
  - If old document deletion fails: Delete newly created document, keep old document intact
- ✅ Success toast only shown after all operations succeed
- ✅ Added specific error messages for each failure case
- ✅ Implemented client-side transaction logic with proper rollback
- ✅ Added comprehensive test suite (9 tests) covering all error scenarios

**Resolution Date:** 2024
**Validation:** ✅ All tests passing, transactional integrity ensured

---

### 22. File Replacement Staging Approach Flawed

**Severity:** HIGH
**Category:** Functionality / Race Condition
**Status:** ✅ FIXED
**Files:** `app/api/files/[fileId]/route.ts:225-295`

#### Issues (RESOLVED):
- Staging approach implemented (lines 209-223) uploads file to staging location
- Final upload (lines 228-233) uses `newFile` (original request body) directly, NOT the staged file
- Comment on line 227 explicitly states "we use the file we already have in memory" - defeats staging purpose
- If original file stream is corrupted or modified during upload, staging doesn't help
- Staging files can become orphaned if crash occurs before cleanup (lines 281-289 show cleanup is best-effort)
- Reintroduces race conditions that Bug #7 was supposed to fix

#### Impact:
- **HIGH** - Undermines the fix for Bug #7 (race condition)
- Staging approach doesn't provide the intended protection
- Can still lose files if original upload fails after staging succeeds
- Orphaned staging files consume storage space

#### Fix Applied:
✅ **RESOLVED** - Final upload now uses verified staged file instead of original `newFile`
- **Fixed:** Download staged file and use it for final upload (implemented download + upload approach)
- **Fixed:** Staging file verification (download fails if staging file doesn't exist, ensuring verification)
- **Fixed:** Added logging for staging file operations (copy start and success messages)
- **Fixed:** Updated rollback logic to handle staging file cleanup on all error paths
- **Fixed:** Added tests verifying staged file is downloaded between staging upload and final upload
- **Note:** Orphaned staging file cleanup (background job/TTL) left as future enhancement - current cleanup on error paths is sufficient for correctness

**Security Improvement:** Staging approach now provides intended protection - final upload uses verified staged file, not potentially corrupted original stream. This ensures that if the original file stream is corrupted or modified during upload, the staging process catches it.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 8. Excessive Console Logging in Production

**Severity:** MEDIUM
**Files:** Multiple (411 instances found)

#### Issues:
- 411 console.log/console.error statements throughout codebase
- Logs may expose sensitive information
- Performance impact in production
- No structured logging system

**Fix Required:**
- Replace with proper logging library (e.g., winston, pino)
- Add log levels (debug, info, warn, error)
- Remove sensitive data from logs
- Use environment-based log levels

---

### 9. Date/Time Handling Inconsistencies

**Severity:** MEDIUM
**Files:** 
- `lib/workos/organizations.ts`
- `lib/supabase/queries.ts`

#### Issues:
- Inconsistent handling of Date objects vs strings
- Multiple conversion attempts suggest uncertainty about data types
- `formatTimeAgo` functions in multiple files (code duplication)
- Potential timezone issues

**Fix Required:**
- Standardize on ISO 8601 strings or Date objects
- Create utility function for date handling
- Add timezone handling if needed
- Consolidate `formatTimeAgo` into single utility

---

### 10. Missing Input Validation in API Endpoints

**Severity:** MEDIUM
**Files:** Multiple API routes

#### Issues:
- `app/api/applications/route.ts`: No validation of ID format (could allow SQL injection if used incorrectly)
- Some endpoints don't validate UUID formats
- Missing validation for enum values
- No rate limiting on API endpoints

**Fix Required:**
- Add input validation middleware or validation functions
- Validate UUID formats using regex or library
- Add rate limiting for public endpoints
- Validate enum values

---

### 11. No Authorization Check for GET Applications

**Severity:** MEDIUM
**File:** `app/api/applications/route.ts:90-113`

#### Issues:
- GET endpoint doesn't require authentication
- Returns all applications without filtering by user permissions
- Could expose sensitive application data

**Fix Required:**
- Add authentication check
- Filter applications based on user groups/permissions
- Only return applications user has access to

---

### 12. Potential Null/Undefined Access

**Severity:** MEDIUM
**Files:** Multiple

#### Issues:
- Many optional chaining (`?.`) but some places assume values exist
- `lib/workos/organizations.ts`: Accessing properties without null checks
- `components/FileViewer.tsx`: Multiple potential null accesses

**Fix Required:**
- Add comprehensive null checks
- Use TypeScript strict null checks
- Add runtime validation for critical paths

---

### 13. File Upload Size Limit Inconsistency

**Severity:** MEDIUM
**Files:**
- `app/api/files/upload/route.ts:5` - 50MB
- `app/api/files/[fileId]/route.ts:5` - 50MB

#### Issues:
- Hardcoded constants in multiple files (DRY violation)
- If limit needs to change, must update multiple locations
- No configuration option

**Fix Required:**
- Move to shared constant or environment variable
- Document size limits clearly
- Consider making it configurable

---

### 14. Missing Error Recovery in File Upload

**Severity:** MEDIUM
**File:** `app/api/files/upload/route.ts:169-182`

#### Issues:
- If database insert fails after storage upload, file remains in storage
- Cleanup is attempted but not guaranteed
- No retry mechanism for transient failures

**Fix Required:**
- Improve cleanup reliability
- Add retry logic for transient database errors
- Consider cleanup job for orphaned files

---

### 23. Slug Generation Logic Produces Empty Slugs and Inconsistent Underscore Handling

**Severity:** MEDIUM
**Category:** Functionality / Validation
**Status:** 🔴 ACTIVE
**Files:** `app/api/tags/route.ts:80-94`

#### Issues:
- Validation regex (line 81) `/^[a-zA-Z0-9\s\-_]+$/` allows underscores in tag names
- Slug generation regex (line 93) `/[^a-z0-9\s-]/g` removes underscores (pattern allows `\s-` but `_` is not in allowed character set)
- Inconsistency: validation allows underscores but slug generation removes them
- If tag name consists only of underscores or other removed characters, slug becomes empty string
- Empty slug could cause database constraint violations (NOT NULL, UNIQUE constraints) or duplicate key issues
- Mismatch between validated name and resulting slug can confuse users

#### Impact:
- **MEDIUM** - Can cause validation errors at runtime
- Edge case but can cause database errors
- Inconsistency between validation rules and slug generation

#### Fix Required:
- Align slug generation with validation: either allow underscores in slugs or disallow them in validation
- Add validation to ensure slug is not empty after generation
- If slug is empty, generate a fallback slug (e.g., `tag-{timestamp}` or `tag-{uuid}`)
- Add check before database insert to validate slug is not empty
- Consider updating validation regex to match slug generation rules, or vice versa
- Add test cases for edge cases (underscore-only names, empty after processing, etc.)

---

### 24. Document Changes Not Displayed After Save Until Page Reload

**Severity:** MEDIUM
**Category:** Functionality / UI State Management
**Status:** 🔴 ACTIVE
**Files:** `components/DocumentEditor.tsx`, `components/DocumentMetadataEditor.tsx`, `components/DocumentViewer.tsx`, `app/page.tsx`

#### Issues:
- When saving document content or metadata changes, the UI doesn't reflect the updates immediately
- User must manually reload the page to see saved changes
- Document content saved via `DocumentEditor.tsx` (line 120-154) successfully updates database
- After save, `onSave()` callback is called (line 146) but doesn't trigger UI refresh
- `DocumentMetadataEditor.tsx` has similar issue - saves successfully but parent component doesn't refresh display
- `DocumentViewer.tsx` displays document content but doesn't reload after edits

#### Impact:
- **MEDIUM** - Poor user experience, requires manual page reload
- Users may think changes weren't saved
- Confusing UX - user expects immediate visual feedback after saving
- Data is saved correctly but UI state is stale

#### Fix Required:
- Ensure `onSave()` callback in parent component (`app/page.tsx`) refreshes the selected document data
- Update `DocumentViewer` component to refresh document content when `document` prop changes
- Add state refresh mechanism after successful save operations
- Consider using React state management or refetching document data after save
- Ensure document list and document view are synchronized after saves
- Test both content edits and metadata edits refresh correctly

---

### 25. Tag Search Bar Not Refreshing After Tag Creation

**Severity:** MEDIUM
**Category:** Functionality / UI State Management
**Status:** 🔴 ACTIVE
**Files:** `components/SearchBar.tsx`, `components/TagSelector.tsx`, `app/api/tags/route.ts`

#### Issues:
- After creating a new tag and adding it to a document, the search bar doesn't show the new tag until page reload
- Tags are loaded once in `SearchBar.tsx` useEffect (line 61-69) but not refreshed after tag creation
- Tag creation happens in `TagSelector.tsx` or tag management UI, but `SearchBar` component doesn't subscribe to tag updates
- Keyboard shortcut (⌘K) overlaps with filter icon - creates UX conflict
- Keyboard shortcut hint displayed in search bar (line 478-484) conflicts with filter button placement

#### Impact:
- **MEDIUM** - Poor user experience, tags don't appear immediately after creation
- Users may think tag creation failed
- Keyboard shortcut overlap causes confusion and accessibility issues
- Filter icon functionality may be obscured by keyboard shortcut hint

#### Fix Required:
- Add tag refresh mechanism in `SearchBar` component after tag creation
- Consider using React context or event emitter to notify `SearchBar` when tags are created
- Refresh tags list after successful tag creation via API callback
- Remove or relocate keyboard shortcut hint to avoid overlap with filter icon
- Consider making keyboard shortcut configurable or removing if it conflicts with filter UI

---

### 26. User Role Management Not Saving to WorkOS and Local Database

**Severity:** HIGH
**Category:** Functionality / Data Integrity
**Status:** 🔴 ACTIVE
**Files:** `app/api/users/role/route.ts`, `lib/workos/organizations.ts`, Admin user management UI

#### Issues:
- Adding roles to a user as admin is not working
- Changes are not being saved to WorkOS
- Changes are not being saved to local database
- Admin role management UI may not be properly calling the update API
- `updateUserRoleInOrganization` function may be failing silently

#### Preferred Behaviour:
- Show list of active roles in WorkOS
- Allow admin to select from that list
- Save the change to both WorkOS and local database
- Provide feedback on save success/failure
- Update user interface immediately after successful save

#### Impact:
- **HIGH** - Critical admin functionality broken
- Cannot manage user roles and permissions
- Security concern - incorrect role assignments
- User access control may be compromised

#### Fix Required:
- Debug `app/api/users/role/route.ts` POST endpoint (lines 74-136)
- Verify WorkOS API calls in `updateUserRoleInOrganization` function
- Ensure database updates succeed before WorkOS updates
- Add proper error handling and rollback mechanism
- Verify admin UI is calling the correct API endpoint with correct parameters
- Add logging to track where the save process fails
- Test end-to-end: UI → API → WorkOS → Database

---

### 27. Admin Role Change Doesn't Revoke Document Access

**Severity:** HIGH
**Category:** Security / Access Control
**Status:** 🔴 ACTIVE
**Files:** `app/api/users/role/route.ts`, `app/api/documents/route.ts`, `components/DocumentViewer.tsx`, `app/page.tsx`

#### Issues:
- When admin changes a user's role, the user can still see documents they shouldn't have access to
- Document access is checked when page loads but not re-checked after role changes
- Admin can open a document, change role, and still see the document even if new role has no access
- No session/access refresh after role change
- Client-side state may be caching document access permissions

#### Preferred Behaviour:
- When admin changes a user's role, redirect to home page
- Immediately check and enforce new role permissions
- Only show documents the user has access to based on new role
- Clear cached document access on role change
- Refresh user groups/permissions immediately

#### Impact:
- **HIGH** - Security vulnerability
- Users with downgraded roles retain access to unauthorized documents
- Access control is bypassed through cached permissions
- Potential data breach if sensitive documents remain accessible

#### Fix Required:
- Add role change listener in client components to refresh permissions
- Clear document cache when role changes
- Implement redirect to home page after role change (if admin changed another user)
- Force re-authentication or permission refresh after role update
- Update `app/api/documents/route.ts` to validate role changes affect document access
- Clear client-side state (selectedDocument, documentList) after role change
- Add server-side session invalidation on role change
- Test: Change role → verify access revoked → verify redirect

---

### 28. No Distinction Between Global Admin and Entity Admin

**Severity:** MEDIUM
**Category:** Security / Access Control / Design
**Status:** 🔴 ACTIVE
**Files:** `lib/auth/user-groups.ts`, `lib/workos/team-sync.ts`, `app/api/documents/route.ts`, Admin UI

#### Issues:
- Currently no difference between global admin and entity admin
- Global admin should have access to all files of all entities
- Entity admin should only have access to files of their specific entity
- Current admin check (`isAdmin`) treats all admins the same
- No entity/team-scoped admin role implementation

#### Impact:
- **MEDIUM** - Access control design issue
- Cannot implement entity-specific admin privileges
- All admins have full system access regardless of entity
- May violate organizational access control requirements
- Cannot delegate entity-level administration

#### Fix Required:
- Design admin role hierarchy (global admin vs entity admin)
- Implement entity/team-scoped admin checking
- Update `isAdmin()` function to accept optional entity/team parameter
- Create `isEntityAdmin(entityId)` function
- Update document access logic to respect entity admin scope
- Update WorkOS role structure to support entity-level admin roles
- Modify admin UI to show appropriate entities based on admin type
- Update API endpoints to check entity admin access where applicable
- Add migration plan for existing admin users

---

## 🟢 LOW PRIORITY ISSUES

### 15. Code Duplication

**Severity:** LOW
**Files:** Multiple

#### Issues:
- `formatTimeAgo` function duplicated in:
  - `app/api/documents/route.ts:119-137`
  - `lib/supabase/queries.ts:308-326`
- Date handling logic repeated in multiple places
- Icon component mapping duplicated

**Fix Required:**
- Extract to shared utilities
- Create common date formatting library
- Centralize icon mapping

---

### 16. Type Safety Issues

**Severity:** LOW
**Files:** Multiple

#### Issues:
- Many `any` types used
- Type assertions (`as any`) bypass type checking
- Missing strict TypeScript configuration

**Fix Required:**
- Replace `any` with proper types
- Remove unsafe type assertions
- Enable strict TypeScript checks

---

### 17. Missing JSDoc/Comments

**Severity:** LOW
**Files:** Some API routes

#### Issues:
- Some functions lack documentation
- Complex logic in `lib/auth/user-groups.ts` needs more documentation
- API route parameters not always documented

**Fix Required:**
- Add JSDoc comments to all public functions
- Document API endpoints with OpenAPI/Swagger
- Add inline comments for complex logic

---

### 18. Inefficient Database Queries

**Severity:** LOW
**Files:** 
- `lib/auth/user-groups.ts`
- `lib/workos/organizations.ts`

#### Issues:
- Multiple sequential queries that could be batched
- N+1 query problems in some loops
- No query result caching where appropriate

**Fix Required:**
- Batch database queries where possible
- Add query result caching for frequently accessed data
- Use database joins instead of multiple queries

---

### 19. Environment Variable Validation

**Severity:** LOW
**Files:** Multiple

#### Issues:
- Environment variables accessed without validation
- Missing variables could cause runtime errors
- No startup validation of required env vars

**Fix Required:**
- Add startup validation for required environment variables
- Use schema validation for env vars (e.g., zod)
- Provide clear error messages for missing vars

---

### 20. Missing Request Timeout Handling

**Severity:** LOW
**Files:** API routes

#### Issues:
- No timeout on external API calls (WorkOS, Supabase)
- Long-running requests could hang indefinitely
- No retry logic for failed requests

**Fix Required:**
- Add timeout to all external API calls
- Implement retry logic with exponential backoff
- Add circuit breaker pattern for external services

---

## 📊 SUMMARY

- **Critical Issues:** 0 (All 3 resolved ✅)
- **High Priority:** 0 (All 6 resolved ✅)
- **Medium Priority:** 9 (8 existing + Bug #23)
- **Low Priority:** 5

### Recommended Action Plan:

1. **✅ COMPLETED (Critical & High Priority):**
   - ✅ Fixed TypeScript compilation errors
   - ✅ Added XSS protection (DOMPurify sanitization)
   - ✅ Added authentication/authorization to file operations
   - ✅ Improved file validation (MIME type + extension)
   - ✅ Fixed error handling in WorkOS operations
   - ✅ Addressed race conditions with staging approach
   - ✅ Fixed document type change transactional integrity
   - ✅ Fixed file replacement staging approach (now uses staged file, not original)

2. **Medium-term (Medium Priority):**
   - Implement proper logging
   - Standardize date handling
   - Add comprehensive input validation

3. **Long-term (Low Priority):**
   - Refactor code duplication
   - Improve type safety
   - Optimize database queries

---

## ✅ ARCHIVED FIXES - RESOLVED

The following issues have been resolved and validated. See [BUG_FIX_TODO.md](./BUG_FIX_TODO.md) for validation details.

**Related Files:**
- [BUG_FIX_TODO.md](./BUG_FIX_TODO.md) - Detailed fix tracking and validation
- [BUG_REPORTS.md](./BUG_REPORTS.md) - User bug reports staging area

### 1. TypeScript Compilation Errors ✅ RESOLVED
**File:** `lib/workos/organizations.ts`  
**Status:** All TypeScript errors fixed, proper type guards implemented, WorkOS SDK response handling corrected.

### 2. Cross-Site Scripting (XSS) Vulnerabilities ✅ RESOLVED
**Files:** `components/DocumentViewer.tsx`, `components/DocumentVersionHistory.tsx`, `components/FileViewer.tsx`  
**Status:** DOMPurify sanitization implemented in all components with proper whitelist configuration.

### 3. Missing Authentication/Authorization in File Operations ✅ RESOLVED
**File:** `app/api/files/[fileId]/route.ts`  
**Status:** Authentication and authorization checks implemented for PUT and DELETE endpoints with `canModifyFile()` helper.

### 4. Incomplete File Type Validation ✅ RESOLVED
**Files:** `app/api/files/upload/route.ts`, `components/FileViewer.tsx`  
**Status:** Shared validation module created, both MIME type and extension validation implemented.

### 5. Insecure File Name Handling ✅ RESOLVED
**File:** `app/api/files/upload/route.ts`  
**Status:** Comprehensive filename validation and sanitization implemented, path traversal prevention in place.

### 6. Missing Error Handling in WorkOS Operations ✅ RESOLVED
**File:** `lib/workos/organizations.ts`  
**Status:** Enhanced error logging and meaningful error messages implemented, functions return error objects instead of throwing.

### 7. Race Condition in File Operations ✅ RESOLVED
**File:** `app/api/files/[fileId]/route.ts`  
**Status:** Staging area approach implemented to prevent file loss, rollback mechanisms in place.

---

## 🔍 TESTING RECOMMENDATIONS

1. **Security Testing:**
   - XSS injection tests
   - Authentication/authorization bypass tests
   - File upload validation tests

2. **Integration Testing:**
   - WorkOS API integration tests
   - Supabase operations tests
   - File operations end-to-end tests

3. **Error Handling Tests:**
   - Network failure scenarios
   - API error responses
   - Database connection failures

---

**Note:** This bug list should be reviewed and prioritized based on your specific use case and deployment environment. Security issues should always be addressed first.
