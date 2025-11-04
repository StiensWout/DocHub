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
 * Validate if a string is a valid UUID format
 * @param uuid - The string to validate
 * @param strict - If true, only accepts UUID v4. If false, accepts any UUID format (default: false)
 * @returns True if valid UUID format, false otherwise
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
 * Validate UUID and return validation result with error message
 * @param uuid - The string to validate
 * @param fieldName - Name of the field being validated (for error messages)
 * @param strict - If true, only accepts UUID v4. If false, accepts any UUID format (default: false)
 * @returns Object with validation result and error message if invalid
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
 * Validate if a value is one of the allowed enum values
 * @param value - The value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - Name of the field being validated (for error messages)
 * @returns Object with validation result and error message if invalid
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
 * Validate an array of UUIDs
 * @param uuids - Array of UUID strings to validate
 * @param fieldName - Name of the field being validated (for error messages)
 * @param strict - If true, only accepts UUID v4. If false, accepts any UUID format (default: false)
 * @param minLength - Minimum array length (default: 1). Set to 0 to allow empty arrays for optional parameters
 * @returns Object with validation result and error message if invalid
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
 * Validate that a string is not empty and is within length limits
 * @param value - The string to validate
 * @param fieldName - Name of the field being validated (for error messages)
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length (optional)
 * @returns Object with validation result and error message if invalid
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
 * Validate that a value is an array
 * @param value - The value to validate
 * @param fieldName - Name of the field being validated (for error messages)
 * @param minLength - Minimum array length (default: 0)
 * @returns Object with validation result and error message if invalid
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

