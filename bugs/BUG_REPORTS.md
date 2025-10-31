# User Bug Reports - Staging Area

**Purpose:** This file serves as a staging area for user-reported bugs before they are analyzed and added to the official bug tracking system.

**Workflow:**
1. Users report bugs here using the simplified format below
2. Bugs are analyzed for:
   - Reproducibility
   - Severity assessment
   - Verification of the issue
   - Duplicate checking
3. After analysis, bugs are either:
   - **Accepted:** Added to [BUG_LIST.md](./BUG_LIST.md) with proper categorization
   - **Rejected:** Marked as invalid/duplicate/not-a-bug with explanation
   - **Deferred:** Moved to future consideration

**Status Legend:**
- 🟡 **PENDING** - Awaiting analysis
- 🔵 **ANALYZING** - Currently being investigated
- ✅ **ACCEPTED** - Added to BUG_LIST.md
- ❌ **REJECTED** - Invalid, duplicate, or not a bug
- ⏸️ **DEFERRED** - Valid but low priority, moved to backlog

---

## ✅ ACCEPTED - MOVED TO BUG_LIST.md

### Bug Report #1 ✅ ACCEPTED

**Reported Date:** 2024-12-19
**Severity:** HIGH
**Category:** Functionality / Data Integrity

**Description:**
The document type change operation, which creates a new document, copies tags, and deletes the old one, lacks transactional integrity. If tag copying or old document deletion fails, the process continues, leading to data inconsistency (duplicate documents) or data loss (old document deleted, new one missing tags), even if a success message is shown.

**Affected Files:** `components/DocumentMetadataEditor.tsx:70-130`

**Analysis:**
- ✅ **VERIFIED:** Bug confirmed in code review
- **Issue Details:**
  - Line 117-121: `fetch()` call to copy tags has no error handling - failures are silently ignored
  - Line 125: `supabase.delete()` has no error checking - deletion failures are ignored
  - Line 127: Success toast shown regardless of whether tag copying or deletion succeeded
- **Impact:** HIGH - Can result in duplicate documents or data loss
- **Duplicate Check:** No existing bug for this specific issue
- **Priority:** HIGH - Data integrity issue

**Action Taken:** Added to BUG_LIST.md as Bug #21

---

### Bug Report #2 ✅ ACCEPTED

**Reported Date:** 2024-12-19
**Severity:** HIGH
**Category:** Functionality / Race Condition

**Description:**
The file replacement logic's staging approach is flawed. The final upload uses the original file directly, not the staged version, which reintroduces race conditions. This also means staging files can become orphaned if a crash occurs before cleanup.

**Affected Files:** `app/api/files/[fileId]/route.ts:193-235`

**Analysis:**
- ✅ **VERIFIED:** Bug confirmed in code review
- **Issue Details:**
  - Line 209-223: Uploads new file to staging location (correct)
  - Line 228-233: Uploads `newFile` (original request body) directly to final location, NOT the staged file
  - Comment on line 227 explicitly states "we use the file we already have in memory" - this defeats the staging purpose
  - If the original file stream is corrupted or modified during upload, staging doesn't help
  - Staging files can become orphaned (lines 281-289 show cleanup is best-effort)
- **Impact:** HIGH - Reintroduces race conditions that Bug #7 was supposed to fix
- **Duplicate Check:** Related to Bug #7 (Race Condition) but different issue - staging implementation flaw
- **Priority:** HIGH - Undermines the fix for a critical bug

**Action Taken:** Added to BUG_LIST.md as Bug #22

---

### Bug Report #3 ✅ ACCEPTED

**Reported Date:** 2024-12-19
**Severity:** MEDIUM
**Category:** Functionality / Validation

**Description:**
The slug generation logic can produce empty slugs if the tag name consists only of characters removed during processing, which may lead to database issues. It also inconsistently handles underscores: validation allows them, but slug generation removes them, causing a mismatch between the validated name and the resulting slug.

**Affected Files:** `app/api/tags/route.ts:80-94`

**Analysis:**
- ✅ **VERIFIED:** Bug confirmed in code review
- **Issue Details:**
  - Line 81: Validation regex `/^[a-zA-Z0-9\s\-_]+$/` allows underscores
  - Line 93: Slug generation regex `/[^a-z0-9\s-]/g` removes underscores (pattern allows `\s-` but `_` is not in the allowed set)
  - Line 90-94: If tag name is only underscores or other removed characters, slug becomes empty string
  - Empty slug could cause database constraint violations or duplicate key issues
- **Impact:** MEDIUM - Can cause validation errors and inconsistency between validation and slug generation
- **Duplicate Check:** No existing bug for this specific issue
- **Priority:** MEDIUM - Edge case but can cause runtime errors

**Action Taken:** Added to BUG_LIST.md as Bug #23

---

## 🟡 PENDING ANALYSIS

_No pending reports at this time._

---

## 🔵 ANALYZING

_No bugs currently being analyzed._

---

## ❌ REJECTED

_Bugs that were rejected (duplicates, invalid, not a bug) will be listed here with explanation._

---

## ⏸️ DEFERRED

_Bugs that are valid but deferred for future consideration will be listed here._

---

## 📝 How to Report a Bug

Simply add a new entry using this format:

```markdown
##Bug [NUMBER]:

[Description of the bug]

Affected files: [file path]:[line numbers]
```

Example:
```markdown
##Bug 4:

The login button doesn't work on mobile devices.

Affected files: components/LoginForm.tsx:45-50
```

---

## 📊 Statistics

- **Total Reports:** 3
- **Pending:** 0
- **Analyzing:** 0
- **Accepted:** 3
- **Rejected:** 0
- **Deferred:** 0

---

**Last Updated:** 2024-12-19
**Maintained By:** Development Team
