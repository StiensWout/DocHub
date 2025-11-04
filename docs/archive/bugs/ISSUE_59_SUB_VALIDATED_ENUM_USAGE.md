# Issue: Inconsistent Use of Validated Enum Values in API Endpoints

**Related PR**: #59  
**Related Review**: https://github.com/StiensWout/DLWait/pull/59#pullrequestreview-3414822559  
**Status**: Fixed  
**Priority**: Low (Code Quality)

## Problem Description

Based on the PR review comments, there's an inconsistency in how validated enum values are used across API endpoints. The review recommends following a pattern of extracting validated values and using them consistently throughout the function for type safety and clarity.

### Current Issue

In `app/api/documents/[documentId]/tags/route.ts`:
- **GET handler (line 36)**: Validates `documentType` enum but uses the raw `documentType` variable instead of extracting `validatedDocumentType`
- **DELETE handler (line 200)**: Uses `documentTypeValidation.value!` directly instead of extracting it to a variable first

### Best Practice Pattern

The review comment suggests this pattern:
```typescript
const documentTypeValidation = validateEnum(documentType, DocumentType, 'documentType');
if (!documentTypeValidation.valid) {
  return NextResponse.json({ error: documentTypeValidation.error }, { status: 400 });
}

const validatedDocumentType = documentTypeValidation.value!;
// Use validatedDocumentType throughout the function instead of raw documentType
```

This pattern:
- Ensures type safety (TypeScript knows the exact enum type)
- Prevents accidental usage of unvalidated input
- Makes the code more explicit and maintainable
- Follows the same pattern used in `validate-access/route.ts` and `users/role/route.ts`

## Solution

Update `app/api/documents/[documentId]/tags/route.ts` to:
1. Extract `validatedDocumentType` in the GET handler and use it instead of raw `documentType`
2. Extract `validatedDocumentType` in the DELETE handler for consistency (currently uses `documentTypeValidation.value!`)

## Files Changed

- `app/api/documents/[documentId]/tags/route.ts` - Extract and use validated enum values consistently

## Testing

- Verify GET endpoint still works correctly with validated documentType
- Verify DELETE endpoint still works correctly with validated documentType
- Ensure no breaking changes to API behavior

## Related

- PR #59: Fix #29: Add comprehensive input validation to API endpoints
- Issue #29: Missing Input Validation in API Endpoints - Security Risk
- Sub-issue: validateUUIDArray empty array rejection (#59 sub-issue)

