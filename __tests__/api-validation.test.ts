/**
 * API Validation Test Suite
 * Tests for API input validation utilities to prevent SQL injection and ensure data integrity
 */

import {
  isValidUUID,
  validateUUID,
  validateEnum,
  validateUUIDArray,
  validateString,
  validateArray,
  DocumentType,
  FileVisibility,
} from '@/lib/validation/api-validation';

describe('API Validation Tests', () => {
  describe('isValidUUID', () => {
    test('should accept valid UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    test('should accept valid UUID v1 (non-strict mode)', () => {
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8', false)).toBe(true);
    });

    test('should reject invalid UUID formats', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
    });

    test('should reject null/undefined', () => {
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID(undefined)).toBe(false);
    });

    test('should reject empty strings', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('   ')).toBe(false);
    });
  });

  describe('validateUUID', () => {
    test('should validate valid UUID', () => {
      const result = validateUUID('550e8400-e29b-41d4-a716-446655440000');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject invalid UUID with descriptive error', () => {
      const result = validateUUID('not-a-uuid', 'documentId');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('documentId');
      expect(result.error).toContain('UUID format');
    });

    test('should reject null/undefined with error', () => {
      const result = validateUUID(null, 'userId');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('userId');
      expect(result.error).toContain('required');
    });

    test('should reject empty string', () => {
      const result = validateUUID('   ', 'tagId');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('validateEnum', () => {
    test('should validate valid enum value', () => {
      const result = validateEnum('base', DocumentType, 'documentType');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('base');
    });

    test('should reject invalid enum value', () => {
      const result = validateEnum('invalid', DocumentType, 'documentType');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('documentType');
      expect(result.error).toContain('base, team');
    });

    test('should reject null/undefined', () => {
      const result = validateEnum(null, DocumentType);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should handle FileVisibility enum', () => {
      expect(validateEnum('public', FileVisibility).valid).toBe(true);
      expect(validateEnum('private', FileVisibility).valid).toBe(true);
      expect(validateEnum('team', FileVisibility).valid).toBe(true);
      expect(validateEnum('invalid', FileVisibility).valid).toBe(false);
    });
  });

  describe('validateUUIDArray', () => {
    const validUUID1 = '550e8400-e29b-41d4-a716-446655440000';
    const validUUID2 = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUUID = 'not-a-uuid';

    describe('default behavior (minLength: 1)', () => {
      test('should accept array with valid UUIDs', () => {
        const result = validateUUIDArray([validUUID1, validUUID2]);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept single UUID', () => {
        const result = validateUUIDArray([validUUID1]);
        expect(result.valid).toBe(true);
      });

      test('should reject empty array (default minLength: 1)', () => {
        const result = validateUUIDArray([]);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least 1 element');
      });

      test('should reject array with invalid UUID', () => {
        const result = validateUUIDArray([validUUID1, invalidUUID]);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('IDs[1]');
      });

      test('should reject null/undefined', () => {
        expect(validateUUIDArray(null).valid).toBe(false);
        expect(validateUUIDArray(undefined).valid).toBe(false);
      });

      test('should reject non-array values', () => {
        const result = validateUUIDArray('not-an-array' as any);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be an array');
      });
    });

    describe('minLength: 0 (allow empty arrays)', () => {
      test('should accept empty array when minLength is 0', () => {
        const result = validateUUIDArray([], 'tagIds', false, 0);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept array with valid UUIDs when minLength is 0', () => {
        const result = validateUUIDArray([validUUID1, validUUID2], 'tagIds', false, 0);
        expect(result.valid).toBe(true);
      });

      test('should still validate UUID format even when empty is allowed', () => {
        const result = validateUUIDArray([invalidUUID], 'tagIds', false, 0);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('tagIds[0]');
      });
    });

    describe('minLength: 2 (require at least 2 elements)', () => {
      test('should accept array with 2+ UUIDs', () => {
        const result = validateUUIDArray([validUUID1, validUUID2], 'tagIds', false, 2);
        expect(result.valid).toBe(true);
      });

      test('should reject array with only 1 UUID when minLength is 2', () => {
        const result = validateUUIDArray([validUUID1], 'tagIds', false, 2);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least 2 element');
      });

      test('should reject empty array when minLength is 2', () => {
        const result = validateUUIDArray([], 'tagIds', false, 2);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least 2 element');
      });
    });

    describe('custom field names', () => {
      test('should use custom field name in error messages', () => {
        const result = validateUUIDArray([], 'tagIds', false, 1);
        expect(result.error).toContain('tagIds');
      });
    });

    describe('strict UUID v4 validation', () => {
      const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const uuidV4 = '550e8400-e29b-41d4-a716-446655440000';

      test('should accept UUID v4 in strict mode', () => {
        const result = validateUUIDArray([uuidV4], 'ids', true);
        expect(result.valid).toBe(true);
      });

      test('should reject UUID v1 in strict mode', () => {
        const result = validateUUIDArray([uuidV1], 'ids', true);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('ids[0]');
      });

      test('should accept UUID v1 in non-strict mode', () => {
        const result = validateUUIDArray([uuidV1], 'ids', false);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateString', () => {
    test('should accept valid string', () => {
      const result = validateString('hello', 'name');
      expect(result.valid).toBe(true);
    });

    test('should reject null/undefined', () => {
      expect(validateString(null, 'name').valid).toBe(false);
      expect(validateString(undefined, 'name').valid).toBe(false);
    });

    test('should reject empty string', () => {
      const result = validateString('', 'name');
      expect(result.valid).toBe(false);
    });

    test('should respect maxLength', () => {
      const result = validateString('a'.repeat(11), 'name', 1, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at most 10');
    });

    test('should respect minLength', () => {
      const result = validateString('ab', 'name', 5);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 5');
    });

    test('should trim whitespace', () => {
      const result = validateString('  hello  ', 'name');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateArray', () => {
    test('should accept valid array', () => {
      const result = validateArray([1, 2, 3], 'items');
      expect(result.valid).toBe(true);
    });

    test('should accept empty array when minLength is 0', () => {
      const result = validateArray([], 'items', 0);
      expect(result.valid).toBe(true);
    });

    test('should reject empty array when minLength is 1', () => {
      const result = validateArray([], 'items', 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 1 element');
    });

    test('should reject null/undefined', () => {
      expect(validateArray(null).valid).toBe(false);
      expect(validateArray(undefined).valid).toBe(false);
    });

    test('should reject non-array values', () => {
      const result = validateArray('not-an-array' as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an array');
    });
  });

  describe('Security scenarios', () => {
    test('should prevent SQL injection attempts in UUIDs', () => {
      const sqlInjection = ["'; DROP TABLE users; --"];
      const result = validateUUIDArray(sqlInjection);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('UUID format');
    });

    test('should prevent XSS attempts in UUIDs', () => {
      const xssAttempt = ['<script>alert("xss")</script>'];
      const result = validateUUIDArray(xssAttempt);
      expect(result.valid).toBe(false);
    });

    test('should handle very long invalid UUIDs', () => {
      const longInvalid = 'a'.repeat(1000);
      const result = validateUUIDArray([longInvalid]);
      expect(result.valid).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle arrays with mixed valid/invalid UUIDs', () => {
      const mixed = [
        '550e8400-e29b-41d4-a716-446655440000',
        'invalid',
        '123e4567-e89b-12d3-a456-426614174000',
      ];
      const result = validateUUIDArray(mixed);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('IDs[1]');
    });

    test('should handle whitespace in UUIDs', () => {
      const withWhitespace = ['  550e8400-e29b-41d4-a716-446655440000  '];
      const result = validateUUIDArray(withWhitespace);
      // Should be valid because validateUUID trims whitespace
      expect(result.valid).toBe(true);
    });

    test('should handle very large arrays', () => {
      const largeArray = Array(1000).fill('550e8400-e29b-41d4-a716-446655440000');
      const result = validateUUIDArray(largeArray);
      expect(result.valid).toBe(true);
    });
  });
});

