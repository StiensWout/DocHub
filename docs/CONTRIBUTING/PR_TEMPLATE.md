# Rebrand TODO List and Add Infrastructure Tasks

## Summary

This PR rebrands the bug tracking TODO list to a comprehensive project TODO list and adds infrastructure/DevOps tasks from user-reported optimizations.

## Changes

### 1. File Rename
- **Renamed:** `bugs/BUG_FIX_TODO.md` → `bugs/TODO.md`
- **Reason:** File now covers all project tasks (bugs, infrastructure, optimizations, rebranding), not just bug fixes

### 2. Documentation Updates
- Updated all references in:
  - `bugs/BUG_LIST.md`
  - `bugs/README.md`
  - `bugs/TODO.md` (self-reference)

### 3. Added Infrastructure & DevOps Tasks

#### Task #1: Upgrade Framework/Packages to Latest Versions (MEDIUM)
- Comprehensive package audit and upgrade plan
- Incremental upgrade strategy (patch → minor → major)
- Focus on Next.js, React, TypeScript, WorkOS, Supabase, Winston
- Estimated: 4-6 hours

#### Task #2: Database Installation/Upgrade/Migration Flow (MEDIUM)
- Fresh database installation script
- Database validation and migration system
- Rollback capability for failed migrations
- Alternative database type investigation
- Estimated: 6-8 hours

#### Task #3: Versioning System Implementation (MEDIUM)
- Semantic versioning setup
- Version display in application UI
- Release management workflow
- Deployment improvements
- Estimated: 4-6 hours

#### Task #4: GitHub Migration - DLWait to DocHub Rebranding (HIGH)
- Complete codebase rebranding
- GitHub repository migration
- Local directory migration
- External references update
- Estimated: 2-4 hours
- **Priority:** HIGH (before public release)

### 4. Progress Tracking Updates
- Updated total task count (38 tasks)
- Added Infrastructure & DevOps section tracking
- Updated time estimates (~121-157 hours total)
- Updated completion percentage (31% overall)

## Files Changed

- `bugs/TODO.md` (renamed from BUG_FIX_TODO.md)
- `bugs/BUG_LIST.md` (updated references)
- `bugs/README.md` (updated references and workflow)
- `bugs/BUG_REPORTS.md` (cleared after processing)

## Testing

- [x] All file references updated correctly
- [x] Markdown links verified
- [x] Documentation structure maintained
- [x] Git history preserved (file rename detected)

## Impact

- ✅ Better organization: All project tasks in one place
- ✅ Clearer naming: `TODO.md` reflects its purpose
- ✅ Infrastructure tasks tracked alongside bugs
- ✅ No breaking changes: All references updated

## Next Steps

1. Review infrastructure tasks prioritization
2. Begin planning GitHub migration (Task #4 - HIGH priority)
3. Schedule package upgrades (Task #1)
4. Start database migration system (Task #2)

## Related Issues

- Addresses optimization requests from `BUG_REPORTS.md`
- Prepares for DocHub rebranding effort
- Sets foundation for versioning and deployment improvements

---

**Branch:** `bugfix/security-fixes-1-6`  
**Commits:** 3 commits
- `96cdc34` - Rename BUG_FIX_TODO.md to TODO.md and update all references
- `552d561` - Clear BUG_REPORTS.md after processing optimization tasks
- `4a96da7` - Rebrand BUG_FIX_TODO.md to general TODO list and add infrastructure tasks

