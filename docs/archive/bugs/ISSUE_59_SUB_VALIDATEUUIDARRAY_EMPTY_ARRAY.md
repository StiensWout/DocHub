# Issue: validateUUIDArray Empty Array Rejection Too Restrictive

**Related PR**: #59  
**Related Discussion**: [PR discussion](https://github.com/StiensWout/DLWait/pull/59#discussion_r2489274241)  
**Status**: Fixed  
**Priority**: Medium

## Problem Description

The `validateUUIDArray` function in `lib/validation/api-validation.ts` rejects empty arrays, which may be too restrictive for optional array parameters. According to the code review comment:

> The function rejects empty arrays, which may be too restrictive for optional array parameters. Consider if empty arrays should be valid in some API contexts where the array is optional but when provided must contain at least one element.
> 
> If empty arrays should be allowed in some cases, consider adding a `minLength` parameter similar to `validateArray`, or document that callers should check for empty arrays before calling this function when empty is acceptable.

## Current Implementation

```typescript
export function validateUUIDArray(
  uuids: string[] | null | undefined,
  fieldName: string = 'IDs',
  strict: boolean = false
): { valid: boolean; error?: string } {
  if (!Array.isArray(uuids)) {
    return {
      valid: false,
      error: `${fieldName} must be an array`,
    };
  }

  if (uuids.length === 0) {  // ← Always rejects empty arrays
    return {
      valid: false,
      error: `${fieldName} array cannot be empty`,
    };
  }
  // ... rest of validation
}
```

## Solution

Add a `minLength` parameter (default: 1) to `validateUUIDArray`, similar to how `validateArray` already implements this pattern. This allows:

- **Default behavior**: Reject empty arrays (minLength: 1) - maintains backward compatibility
- **Flexible usage**: Allow empty arrays when needed (minLength: 0) - for optional parameters

## Implementation Details

1. Add `minLength` parameter to `validateUUIDArray` function signature
2. Use `minLength` check instead of hardcoded `length === 0` check
3. Update function documentation to explain the parameter
4. Update existing usage in `app/api/documents/[documentId]/tags/route.ts` to explicitly specify `minLength: 1` (since tagIds should not be empty)
5. Add tests to verify both minLength: 0 and minLength: 1 behaviors

## Files Changed

- `lib/validation/api-validation.ts` - Add minLength parameter
- `app/api/documents/[documentId]/tags/route.ts` - Update usage (explicit minLength: 1)
- `__tests__/api-validation.test.ts` - Add/update tests

## Testing

- Test that empty arrays are rejected when minLength: 1 (default)
- Test that empty arrays are accepted when minLength: 0
- Test that arrays with length < minLength are rejected
- Test that arrays with length >= minLength are accepted
- Verify backward compatibility (default behavior unchanged)

## Related

- PR #59: Fix #29: Add comprehensive input validation to API endpoints
- Issue #29: Missing Input Validation in API Endpoints - Security Risk

