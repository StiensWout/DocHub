# Bug List and Potential Issues Report

**Generated:** $(date)
**Scope:** Full codebase analysis

## 🔴 CRITICAL ISSUES

### 1. TypeScript Compilation Errors (12 errors in `lib/workos/organizations.ts`) ✅ FIXED

**Severity:** CRITICAL - Prevents compilation  
**Status:** ✅ RESOLVED  
**File:** `lib/workos/organizations.ts`  
**Lines:** 33, 37, 38, 56, 72, 88, 163, 193, 230, 334, 352, 353

#### Issues (Fixed):
- **Line 33:** ✅ Fixed - Map `OrganizationDomain[]` to `string[]` by extracting domain strings using `.map()` with type checking
- **Lines 37-38:** ✅ Fixed - Added type guards checking `typeof === 'string'` before `instanceof Date`
- **Lines 56, 72, 88, 193, 230:** ✅ Fixed - Reordered type checks: check `typeof` first, then `instanceof`
- **Lines 163, 334, 367, 397:** ✅ Fixed - Removed incorrect `{ data, error }` destructuring; WorkOS SDK returns data directly
- **Line 416:** ✅ Fixed - Added type assertion for role update (API supports it but TypeScript types don't reflect it)

**Fix Applied:**
- ✅ Mapped `OrganizationDomain[]` to `string[]` by extracting domain strings with proper type annotations
- ✅ Added proper type guards checking string type before Date type checks
- ✅ Fixed error handling to match actual WorkOS API response structure
  - **Update:** Fixed runtime error - `listOrganizationMemberships` returns `{ data: [] }` structure, not direct array
  - Added handling for both array and object-with-data responses: `Array.isArray(response) ? response : (response?.data || [])`
- ✅ Updated role update logic with type assertion (runtime API supports role, TypeScript types incomplete)

---

### 2. Cross-Site Scripting (XSS) Vulnerabilities ✅ FIXED

**Severity:** CRITICAL - Security risk
**Files:** 
- `components/DocumentViewer.tsx:271`
- `components/DocumentVersionHistory.tsx:228`
- `components/FileViewer.tsx:49, 119`

#### Issues:
Using `dangerouslySetInnerHTML` and `innerHTML` without sanitization allows XSS attacks if document content contains malicious scripts.

**Location:** 
- `DocumentViewer.tsx:271`: `dangerouslySetInnerHTML={{ __html: content }}`
- `DocumentVersionHistory.tsx:228`: Similar usage
- `FileViewer.tsx:49, 119`: Direct `innerHTML` manipulation

**Risk:** 
If document content is user-generated or imported from external sources, malicious JavaScript can be executed.

**Fix Required:**
- Use a sanitization library (e.g., DOMPurify) before rendering
- Consider using React's built-in escaping mechanisms
- Validate and sanitize all HTML content from database

**Fix Applied:**
- ✅ Installed DOMPurify and @types/dompurify
- ✅ **DocumentViewer.tsx**: Added DOMPurify sanitization before `dangerouslySetInnerHTML` with whitelist of allowed HTML tags and attributes
- ✅ **DocumentVersionHistory.tsx**: Applied same DOMPurify sanitization, added "use client" directive
- ✅ **FileViewer.tsx**: 
  - Replaced `innerHTML = ""` with safe DOM manipulation using `removeChild` loop
  - Added DOMPurify sanitization after `renderAsync` completes (both primary and fallback rendering paths)
  - Preserves document structure while removing potential XSS vectors (scripts, event handlers, etc.)

---

### 3. Missing Authentication/Authorization in File Operations ✅ FIXED

**Severity:** CRITICAL - Security risk  
**Status:** ✅ RESOLVED  
**File:** `app/api/files/[fileId]/route.ts`

#### Issues (Fixed):
- ✅ **PUT endpoint:** Added authentication check using `getSession()`
- ✅ **DELETE endpoint:** Added authentication check using `getSession()`
- ✅ **Authorization:** Created `canModifyFile()` helper function for permission checks
- ✅ **Admin access:** Admins can modify any file
- ✅ **Document access:** Checks `document_access_groups` for document-associated files
- ✅ **File ownership:** Verifies `uploaded_by` for application-level files
- ✅ **Visibility checks:** Validates team membership for team-visible files

**Fix Applied:**
- ✅ Added `getSession()` check at start of both PUT and DELETE endpoints
- ✅ Returns 401 Unauthorized if no valid session exists
- ✅ Created `canModifyFile()` helper function that checks:
  - Admin status (admins can modify any file)
  - Document access via `document_access_groups` table
  - File ownership (`uploaded_by` field)
  - Team membership for team-visible files
  - Base document access rules
- ✅ Returns 403 Forbidden if user lacks permission
- ✅ Both endpoints now properly secure file operations
- ✅ Added comprehensive test suite (`__tests__/file-auth.test.ts`) covering authentication and authorization scenarios

**Security Improvements:**
- Unauthenticated users cannot access file operations (401)
- Users can only modify/delete files they have permission for (403)
- Authorization logic handles multiple file association types (document, application, base)
- Proper error messages distinguish between unauthorized (401) and forbidden (403)

---

## 🟠 HIGH PRIORITY ISSUES

### 4. Incomplete File Type Validation ✅ FIXED

**Severity:** HIGH  
**Status:** ✅ RESOLVED  
**Files:** 
- `app/api/files/upload/route.ts`
- `components/FileViewer.tsx`

#### Issues (Fixed):
- ✅ **MIME type only validation:** Now validates both MIME type AND file extension
- ✅ **Inconsistent validation:** FileViewer.tsx now uses same validation utilities as upload route
- ✅ **Malicious file uploads:** Files with mismatched extensions/MIME types are now rejected

**Fix Applied:**
- ✅ Created shared validation module (`lib/constants/file-validation.ts`) with:
  - `ALLOWED_FILE_TYPES` mapping MIME types to valid extensions
  - `validateFileTypeAndExtension()` function that validates both MIME type and extension match
  - Helper functions for extension extraction and validation
- ✅ Updated upload route (`app/api/files/upload/route.ts`) to:
  - Validate file size using shared constant
  - Validate both MIME type AND extension using `validateFileTypeAndExtension()`
  - Reject files with mismatched types/extensions with clear error messages
- ✅ Updated FileViewer.tsx to use shared validation utilities for consistency
- ✅ Added comprehensive test suite (37 tests) covering:
  - Valid and invalid file types/extensions
  - Mismatched type/extension combinations
  - Malicious filenames (path traversal, double extensions, null bytes)
  - Edge cases

**Security Improvements:**
- Prevents malicious files from being uploaded by checking both MIME type and extension
- Rejects files where extension doesn't match declared MIME type (e.g., .exe file with PDF MIME type)
- Consistent validation across upload and viewing components

---

### 5. Insecure File Name Handling ✅ FIXED

**Severity:** HIGH  
**Status:** ✅ RESOLVED  
**File:** `app/api/files/upload/route.ts:94`

#### Issues (Fixed):
- ✅ **Path traversal vulnerability:** Filenames with `..`, `/`, `\` are now rejected and sanitized
- ✅ **No length limit:** Maximum filename length of 255 characters now enforced
- ✅ **Unvalidated paths:** Final storage paths are now validated before upload
- ✅ **Insufficient sanitization:** Comprehensive filename sanitization now implemented

**Fix Applied:**
- ✅ Extended `lib/constants/file-validation.ts` with:
  - `MAX_FILENAME_LENGTH` constant (255 characters)
  - `sanitizeFilename()` function that:
    - Removes path traversal sequences (`..`)
    - Removes directory separators (`/`, `\`)
    - Removes control characters
    - Collapses multiple consecutive dots
    - Enforces length limits while preserving extensions
  - `validateFilename()` function that validates:
    - Path traversal attempts (rejects `..`, `/`, `\`)
    - Control characters (rejects null bytes, DEL, etc.)
    - Length limits (255 characters max)
    - Windows reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
    - Empty or invalid filenames
  - `validateStoragePath()` function that validates:
    - Path traversal prevention
    - Absolute path rejection (Unix `/` and Windows `C:`)
    - Control character filtering
- ✅ Updated upload route (`app/api/files/upload/route.ts`) to:
  - Validate filename using `validateFilename()` before processing
  - Sanitize filename using `sanitizeFilename()` before creating storage path
  - Validate final storage path using `validateStoragePath()` before upload
- ✅ Added comprehensive test suite with 46 tests covering all security scenarios

---

### 6. Missing Error Handling in WorkOS Operations

**Severity:** HIGH
**File:** `lib/workos/organizations.ts`

#### Issues:
- Lines 184-190: Destructures `error` from response that may not have it
- Lines 355-357: Similar issue with `listOrganizationMemberships`
- Errors are swallowed without proper logging or user notification
- Type mismatches suggest API contract may have changed

**Fix Required:**
- Verify WorkOS SDK response structure matches code expectations
- Add proper error handling for all API calls
- Log errors with context
- Return meaningful error messages

---

### 7. Race Condition in File Operations

**Severity:** HIGH
**File:** `app/api/files/[fileId]/route.ts:82-98`

#### Issues:
- File deletion and upload are not atomic
- If upload fails after deletion, file is lost
- No transaction/rollback mechanism
- Storage operations and database updates are not synchronized

**Fix Required:**
- Implement proper transaction handling
- Use staging area for new file before deleting old one
- Add rollback mechanism on failure
- Consider using Supabase storage versioning

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

- **Critical Issues:** 3
- **High Priority:** 4
- **Medium Priority:** 8
- **Low Priority:** 5

### Recommended Action Plan:

1. **Immediate (Critical):**
   - Fix TypeScript compilation errors
   - Add XSS protection (sanitize HTML)
   - Add authentication to file operations

2. **Short-term (High Priority):**
   - Improve file validation
   - Fix error handling in WorkOS operations
   - Address race conditions

3. **Medium-term (Medium Priority):**
   - Implement proper logging
   - Standardize date handling
   - Add comprehensive input validation

4. **Long-term (Low Priority):**
   - Refactor code duplication
   - Improve type safety
   - Optimize database queries

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
