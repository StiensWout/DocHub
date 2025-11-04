/**
 * API Input Validation Utilities
 * 
 * Provides validation functions for API endpoints to prevent SQL injection,
 * invalid data processing, and ensure data integrity.
 */

/**
 * UUID v4 validation regex pattern
 * Matches standard UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * More lenient UUID regex (accepts any UUID version or format)
 * Matches: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Determine whether a value is a valid UUID string.
 *
 * @param uuid - The value to check; may be `null` or `undefined`.
 * @param strict - If `true`, only accept UUID version 4 format; if `false`, accept any UUID version (default: `false`).
 * @returns `true` if `uuid` is a valid UUID string according to `strict`, `false` otherwise.
 */
export function isValidUUID(uuid: string | null | undefined, strict: boolean = false): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  const trimmed = uuid.trim();
  if (trimmed.length === 0) {
    return false;
  }
  
  const regex = strict ? UUID_V4_REGEX : UUID_REGEX;
  return regex.test(trimmed);
}

/**
 * Validate a UUID string and produce a validation result.
 *
 * @param uuid - The value to validate.
 * @param fieldName - Field name used in error messages.
 * @param strict - When `true`, only accept UUID v4; when `false`, accept any standard UUID format.
 * @returns `valid` is `true` when `uuid` is a non-empty string in the expected UUID format, `false` otherwise. When `valid` is `false`, `error` contains a human-readable message.
 */
export function validateUUID(
  uuid: string | null | undefined,
  fieldName: string = 'ID',
  strict: boolean = false
): { valid: boolean; error?: string } {
  if (!uuid || typeof uuid !== 'string') {
    return {
      valid: false,
      error: `${fieldName} is required and must be a string`,
    };
  }
  
  const trimmed = uuid.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: `${fieldName} cannot be empty`,
    };
  }
  
  if (!isValidUUID(trimmed, strict)) {
    return {
      valid: false,
      error: `${fieldName} must be a valid UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate that a string value matches one of the allowed enum values.
 *
 * @param value - The input to validate; leading/trailing whitespace will be trimmed
 * @param allowedValues - Array of permitted string values
 * @param fieldName - Field name used in generated error messages
 * @returns `{ valid: true, value: T }` containing the trimmed allowed value on success; `{ valid: false, error: string }` describing the validation failure otherwise
 */
export function validateEnum<T extends string>(
  value: string | null | undefined,
  allowedValues: readonly T[],
  fieldName: string = 'Field'
): { valid: boolean; error?: string; value?: T } {
  if (value === null || value === undefined) {
    return {
      valid: false,
      error: `${fieldName} is required`,
    };
  }
  
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: `${fieldName} must be a string`,
    };
  }
  
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: `${fieldName} cannot be empty`,
    };
  }
  
  if (!allowedValues.includes(trimmed as T)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
    };
  }
  
  return { valid: true, value: trimmed as T };
}

/**
 * Validate that an array contains only valid UUID strings.
 *
 * @param uuids - Array whose elements are expected to be UUID strings
 * @param fieldName - Field name used in error messages (defaults to "IDs")
 * @param strict - If `true`, require UUID v4 format; if `false`, accept any UUID version (default: `false`)
 * @param minLength - Minimum array length (default: 1). Set to 0 to allow empty arrays for optional parameters
 * @returns An object with `valid: true` when every element is a valid UUID and array length meets requirements; otherwise `valid: false` and an `error` message describing the first failure
 */
export function validateUUIDArray(
  uuids: string[] | null | undefined,
  fieldName: string = 'IDs',
  strict: boolean = false,
  minLength: number = 1
): { valid: boolean; error?: string } {
  if (!Array.isArray(uuids)) {
    return {
      valid: false,
      error: `${fieldName} must be an array`,
    };
  }

  if (uuids.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must contain at least ${minLength} element(s)`,
    };
  }
  
  for (let i = 0; i < uuids.length; i++) {
    const uuid = uuids[i];
    const validation = validateUUID(uuid, `${fieldName}[${i}]`, strict);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Validate that a string is present (after trimming) and its length falls within the provided bounds.
 *
 * @param value - The string to validate
 * @param fieldName - Field name used in error messages
 * @param minLength - Minimum allowed length (default: 1)
 * @param maxLength - Maximum allowed length (optional)
 * @returns An object with `valid: true` when the value meets the requirements; otherwise `valid: false` and an `error` message describing the failure
 */
export function validateString(
  value: string | null | undefined,
  fieldName: string = 'Field',
  minLength: number = 1,
  maxLength?: number
): { valid: boolean; error?: string } {
  if (value === null || value === undefined) {
    return {
      valid: false,
      error: `${fieldName} is required`,
    };
  }
  
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: `${fieldName} must be a string`,
    };
  }
  
  const trimmed = value.trim();
  
  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} character(s) long`,
    };
  }
  
  if (maxLength !== undefined && trimmed.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${maxLength} character(s) long`,
    };
  }
  
  return { valid: true };
}

/**
 * Checks that a value is an array and contains at least a minimum number of elements.
 *
 * @param value - The value to validate
 * @param fieldName - Field name used in error messages
 * @param minLength - Minimum required number of elements (default: 0)
 * @returns An object with `valid: true` when `value` is an array with length >= `minLength`, otherwise `valid: false` and `error` describing the failure
 */
export function validateArray<T>(
  value: T[] | null | undefined,
  fieldName: string = 'Field',
  minLength: number = 0
): { valid: boolean; error?: string } {
  if (value === null || value === undefined) {
    return {
      valid: false,
      error: `${fieldName} is required`,
    };
  }
  
  if (!Array.isArray(value)) {
    return {
      valid: false,
      error: `${fieldName} must be an array`,
    };
  }
  
  if (value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must contain at least ${minLength} element(s)`,
    };
  }
  
  return { valid: true };
}

/**
 * Common enum values used in the API
 */
export const DocumentType = ['base', 'team'] as const;
export type DocumentType = typeof DocumentType[number];

export const FileVisibility = ['public', 'private', 'team'] as const;
export type FileVisibility = typeof FileVisibility[number];