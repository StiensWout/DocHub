/**
 * API Validation Test Suite
 * Comprehensive tests for API input validation utilities to prevent SQL injection,
 * invalid data processing, and ensure data integrity.
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
    describe('Valid UUID formats', () => {
      test('should accept valid UUID v4 format', () => {
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
      });

      test('should accept any UUID version in non-strict mode', () => {
        // UUID v1
        expect(isValidUUID('c232ab00-9414-11ec-b909-0242ac120002', false)).toBe(true);
        // UUID v3
        expect(isValidUUID('a3bb189e-8bf9-3888-9912-ace4e6543002', false)).toBe(true);
        // UUID v4
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000', false)).toBe(true);
        // UUID v5
        expect(isValidUUID('886313e1-3b8a-5372-9b90-0c9aee199e5d', false)).toBe(true);
      });

      test('should be case insensitive', () => {
        expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
        expect(isValidUUID('F47AC10B-58CC-4372-A567-0E02B2C3D479')).toBe(true);
        expect(isValidUUID('550e8400-E29b-41D4-a716-446655440000')).toBe(true);
      });

      test('should accept UUIDs with leading/trailing whitespace', () => {
        expect(isValidUUID('  550e8400-e29b-41d4-a716-446655440000  ')).toBe(true);
        expect(isValidUUID('\t550e8400-e29b-41d4-a716-446655440000\n')).toBe(true);
      });
    });

    describe('Invalid UUID formats', () => {
      test('should reject null and undefined', () => {
        expect(isValidUUID(null)).toBe(false);
        expect(isValidUUID(undefined)).toBe(false);
      });

      test('should reject empty strings', () => {
        expect(isValidUUID('')).toBe(false);
        expect(isValidUUID('   ')).toBe(false);
        expect(isValidUUID('\t\n')).toBe(false);
      });

      test('should reject non-string types', () => {
        expect(isValidUUID(123 as any)).toBe(false);
        expect(isValidUUID({} as any)).toBe(false);
        expect(isValidUUID([] as any)).toBe(false);
        expect(isValidUUID(true as any)).toBe(false);
      });

      test('should reject malformed UUIDs', () => {
        expect(isValidUUID('not-a-uuid')).toBe(false);
        expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false); // Too short
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false); // Too long
        expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false); // No hyphens
      });

      test('should reject UUIDs with invalid characters', () => {
        expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false); // 'g' not hex
        expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000z')).toBe(false); // 'z' not hex
        expect(isValidUUID('550e8400_e29b_41d4_a716_446655440000')).toBe(false); // Underscores
      });

      test('should reject SQL injection attempts', () => {
        expect(isValidUUID("'; DROP TABLE users; --")).toBe(false);
        expect(isValidUUID("1' OR '1'='1")).toBe(false);
        expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000'; DROP TABLE--")).toBe(false);
      });

      test('should reject path traversal attempts', () => {
        expect(isValidUUID('../../../etc/passwd')).toBe(false);
        expect(isValidUUID('..\\..\\..\\windows\\system32')).toBe(false);
      });
    });

    describe('Strict UUID v4 validation', () => {
      test('should only accept UUID v4 in strict mode', () => {
        // Valid v4
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000', true)).toBe(true);
        expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479', true)).toBe(true);
      });

      test('should reject non-v4 UUIDs in strict mode', () => {
        // UUID v1 (version field is '1')
        expect(isValidUUID('c232ab00-9414-11ec-b909-0242ac120002', true)).toBe(false);
        // UUID v3 (version field is '3')
        expect(isValidUUID('a3bb189e-8bf9-3888-9912-ace4e6543002', true)).toBe(false);
        // UUID v5 (version field is '5')
        expect(isValidUUID('886313e1-3b8a-5372-9b90-0c9aee199e5d', true)).toBe(false);
      });
    });
  });

  describe('validateUUID', () => {
    describe('Valid UUIDs', () => {
      test('should return valid for correct UUIDs', () => {
        const result = validateUUID('550e8400-e29b-41d4-a716-446655440000');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should handle custom field names in success', () => {
        const result = validateUUID('550e8400-e29b-41d4-a716-446655440000', 'userId');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept UUIDs with whitespace', () => {
        const result = validateUUID('  550e8400-e29b-41d4-a716-446655440000  ', 'documentId');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('Invalid UUIDs with error messages', () => {
      test('should return error for null', () => {
        const result = validateUUID(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ID is required and must be a string');
      });

      test('should return error for undefined', () => {
        const result = validateUUID(undefined);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ID is required and must be a string');
      });

      test('should return error for non-string types', () => {
        const result = validateUUID(123 as any, 'userId');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('userId is required and must be a string');
      });

      test('should return error for empty string', () => {
        const result = validateUUID('   ', 'teamId');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('teamId cannot be empty');
      });

      test('should return error for invalid UUID format', () => {
        const result = validateUUID('not-a-uuid', 'documentId');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('documentId must be a valid UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
      });

      test('should use custom field names in error messages', () => {
        const result = validateUUID('invalid', 'customFieldName');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('customFieldName');
      });

      test('should handle default field name', () => {
        const result = validateUUID('invalid');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('ID');
      });
    });

    describe('Strict mode validation', () => {
      test('should validate UUID v4 in strict mode', () => {
        const result = validateUUID('550e8400-e29b-41d4-a716-446655440000', 'id', true);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should reject non-v4 UUIDs in strict mode', () => {
        const result = validateUUID('c232ab00-9414-11ec-b909-0242ac120002', 'id', true);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('id must be a valid UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
      });
    });

    describe('Security validation', () => {
      test('should reject SQL injection attempts', () => {
        const sqlInjections = [
          "'; DROP TABLE users; --",
          "1' OR '1'='1",
          "admin'--",
          "' UNION SELECT * FROM users--",
        ];

        sqlInjections.forEach(injection => {
          const result = validateUUID(injection, 'userId');
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        });
      });

      test('should reject XSS attempts', () => {
        const xssAttempts = [
          '<script>alert("xss")</script>',
          'javascript:alert(1)',
          '<img src=x onerror=alert(1)>',
        ];

        xssAttempts.forEach(xss => {
          const result = validateUUID(xss, 'id');
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        });
      });
    });
  });

  describe('validateEnum', () => {
    const roles = ['admin', 'user', 'guest'] as const;

    describe('Valid enum values', () => {
      test('should accept valid enum values', () => {
        const result = validateEnum('admin', roles, 'role');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('admin');
        expect(result.error).toBeUndefined();
      });

      test('should accept all allowed values', () => {
        roles.forEach(role => {
          const result = validateEnum(role, roles, 'role');
          expect(result.valid).toBe(true);
          expect(result.value).toBe(role);
        });
      });

      test('should trim whitespace and validate', () => {
        const result = validateEnum('  admin  ', roles, 'role');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('admin');
      });

      test('should return the validated value', () => {
        const result = validateEnum('user', roles, 'role');
        expect(result.value).toBe('user');
      });
    });

    describe('Invalid enum values', () => {
      test('should reject null', () => {
        const result = validateEnum(null, roles, 'role');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('role is required');
      });

      test('should reject undefined', () => {
        const result = validateEnum(undefined, roles, 'role');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('role is required');
      });

      test('should reject non-string types', () => {
        const result = validateEnum(123 as any, roles, 'role');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('role must be a string');
      });

      test('should reject empty string', () => {
        const result = validateEnum('   ', roles, 'role');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('role cannot be empty');
      });

      test('should reject values not in enum', () => {
        const result = validateEnum('superadmin', roles, 'role');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('role must be one of: admin, user, guest');
      });

      test('should be case sensitive', () => {
        const result = validateEnum('ADMIN', roles, 'role');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('role must be one of: admin, user, guest');
      });

      test('should use custom field names in error messages', () => {
        const result = validateEnum('invalid', roles, 'userRole');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('userRole');
      });
    });

    describe('DocumentType enum', () => {
      test('should validate base document type', () => {
        const result = validateEnum('base', DocumentType, 'documentType');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('base');
      });

      test('should validate team document type', () => {
        const result = validateEnum('team', DocumentType, 'documentType');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('team');
      });

      test('should reject invalid document types', () => {
        const result = validateEnum('private', DocumentType, 'documentType');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('documentType must be one of: base, team');
      });
    });

    describe('FileVisibility enum', () => {
      test('should validate public visibility', () => {
        const result = validateEnum('public', FileVisibility, 'visibility');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('public');
      });

      test('should validate private visibility', () => {
        const result = validateEnum('private', FileVisibility, 'visibility');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('private');
      });

      test('should validate team visibility', () => {
        const result = validateEnum('team', FileVisibility, 'visibility');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('team');
      });

      test('should reject invalid visibility values', () => {
        const result = validateEnum('shared', FileVisibility, 'visibility');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('visibility must be one of: public, private, team');
      });
    });
  });

  describe('validateUUIDArray', () => {
    const validUUIDs = [
      '550e8400-e29b-41d4-a716-446655440000',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    ];

    describe('Valid UUID arrays', () => {
      test('should accept array of valid UUIDs', () => {
        const result = validateUUIDArray(validUUIDs, 'tagIds');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept single element array', () => {
        const result = validateUUIDArray([validUUIDs[0]], 'ids');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept large arrays', () => {
        const largeArray = Array(100).fill(validUUIDs[0]);
        const result = validateUUIDArray(largeArray, 'ids');
        expect(result.valid).toBe(true);
      });

      test('should accept UUIDs with whitespace', () => {
        const uuidsWithWhitespace = [
          '  550e8400-e29b-41d4-a716-446655440000  ',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ];
        const result = validateUUIDArray(uuidsWithWhitespace, 'ids');
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid UUID arrays', () => {
      test('should reject null', () => {
        const result = validateUUIDArray(null, 'tagIds');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must be an array');
      });

      test('should reject undefined', () => {
        const result = validateUUIDArray(undefined, 'tagIds');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must be an array');
      });

      test('should reject non-array types', () => {
        const result = validateUUIDArray('not-an-array' as any, 'tagIds');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must be an array');
      });

      test('should reject empty array', () => {
        const result = validateUUIDArray([], 'tagIds');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds array cannot be empty');
      });

      test('should reject array with invalid UUID', () => {
        const mixedArray = [
          '550e8400-e29b-41d4-a716-446655440000',
          'not-a-uuid',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ];
        const result = validateUUIDArray(mixedArray, 'tagIds');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('tagIds[1]');
      });

      test('should identify position of invalid UUID', () => {
        const arrayWithInvalid = [
          '550e8400-e29b-41d4-a716-446655440000',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          'invalid-uuid',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        ];
        const result = validateUUIDArray(arrayWithInvalid, 'ids');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('[2]');
      });

      test('should reject array with null elements', () => {
        const arrayWithNull = [
          '550e8400-e29b-41d4-a716-446655440000',
          null,
        ] as any;
        const result = validateUUIDArray(arrayWithNull, 'ids');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      test('should reject array with empty string', () => {
        const arrayWithEmpty = [
          '550e8400-e29b-41d4-a716-446655440000',
          '',
        ];
        const result = validateUUIDArray(arrayWithEmpty, 'ids');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('[1]');
      });
    });

    describe('Strict mode validation', () => {
      test('should validate UUID v4 array in strict mode', () => {
        const v4UUIDs = [
          '550e8400-e29b-41d4-a716-446655440000',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ];
        const result = validateUUIDArray(v4UUIDs, 'ids', true);
        expect(result.valid).toBe(true);
      });

      test('should reject non-v4 UUIDs in strict mode', () => {
        const mixedVersions = [
          '550e8400-e29b-41d4-a716-446655440000', // v4
          'c232ab00-9414-11ec-b909-0242ac120002', // v1
        ];
        const result = validateUUIDArray(mixedVersions, 'ids', true);
        expect(result.valid).toBe(false);
      });
    });

    describe('Security validation', () => {
      test('should reject array with SQL injection attempts', () => {
        const maliciousArray = [
          '550e8400-e29b-41d4-a716-446655440000',
          "'; DROP TABLE tags; --",
        ];
        const result = validateUUIDArray(maliciousArray, 'tagIds');
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('validateString', () => {
    describe('Valid strings', () => {
      test('should accept valid string with default constraints', () => {
        const result = validateString('test', 'name');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept string at minimum length', () => {
        const result = validateString('a', 'name', 1, 10);
        expect(result.valid).toBe(true);
      });

      test('should accept string at maximum length', () => {
        const result = validateString('a'.repeat(255), 'name', 1, 255);
        expect(result.valid).toBe(true);
      });

      test('should accept string between min and max', () => {
        const result = validateString('test name', 'name', 1, 100);
        expect(result.valid).toBe(true);
      });

      test('should trim whitespace before validation', () => {
        const result = validateString('  test  ', 'name', 1, 10);
        expect(result.valid).toBe(true);
      });

      test('should accept strings with special characters', () => {
        const result = validateString('Hello, World! @#$%', 'message');
        expect(result.valid).toBe(true);
      });

      test('should accept unicode characters', () => {
        const result = validateString('Hello 世界 🌍', 'message');
        expect(result.valid).toBe(true);
      });

      test('should accept string without max length constraint', () => {
        const longString = 'a'.repeat(10000);
        const result = validateString(longString, 'description', 1);
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid strings', () => {
      test('should reject null', () => {
        const result = validateString(null, 'name');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('name is required');
      });

      test('should reject undefined', () => {
        const result = validateString(undefined, 'name');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('name is required');
      });

      test('should reject non-string types', () => {
        const result = validateString(123 as any, 'name');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('name must be a string');
      });

      test('should reject string shorter than minimum', () => {
        const result = validateString('ab', 'name', 3, 10);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('name must be at least 3 character(s) long');
      });

      test('should reject string longer than maximum', () => {
        const result = validateString('a'.repeat(256), 'name', 1, 255);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('name must be at most 255 character(s) long');
      });

      test('should reject empty string when minLength is 1', () => {
        const result = validateString('', 'name', 1);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('name must be at least 1 character(s) long');
      });

      test('should reject whitespace-only string', () => {
        const result = validateString('   ', 'name', 1);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('name must be at least 1 character(s) long');
      });

      test('should use custom field names in error messages', () => {
        const result = validateString('', 'applicationName', 1);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('applicationName');
      });
    });

    describe('Edge cases', () => {
      test('should handle minLength of 0', () => {
        const result = validateString('', 'optional', 0);
        expect(result.valid).toBe(true);
      });

      test('should handle very long strings', () => {
        const veryLongString = 'a'.repeat(100000);
        const result = validateString(veryLongString, 'text', 1, 100000);
        expect(result.valid).toBe(true);
      });

      test('should handle strings with newlines', () => {
        const result = validateString('line1\nline2\nline3', 'content');
        expect(result.valid).toBe(true);
      });

      test('should handle strings with tabs', () => {
        const result = validateString('col1\tcol2\tcol3', 'content');
        expect(result.valid).toBe(true);
      });
    });

    describe('Real-world scenarios', () => {
      test('should validate application name', () => {
        const result = validateString('My Application', 'Application name', 1, 255);
        expect(result.valid).toBe(true);
      });

      test('should validate icon name', () => {
        const result = validateString('icon-home', 'Icon name', 1, 100);
        expect(result.valid).toBe(true);
      });

      test('should reject too long application name', () => {
        const tooLong = 'a'.repeat(256);
        const result = validateString(tooLong, 'Application name', 1, 255);
        expect(result.valid).toBe(false);
      });

      test('should reject empty application name', () => {
        const result = validateString('', 'Application name', 1, 255);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('validateArray', () => {
    describe('Valid arrays', () => {
      test('should accept non-empty array', () => {
        const result = validateArray([1, 2, 3], 'items');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept array with minLength 0', () => {
        const result = validateArray([], 'items', 0);
        expect(result.valid).toBe(true);
      });

      test('should accept array at exact minLength', () => {
        const result = validateArray([1, 2, 3], 'items', 3);
        expect(result.valid).toBe(true);
      });

      test('should accept array above minLength', () => {
        const result = validateArray([1, 2, 3, 4, 5], 'items', 3);
        expect(result.valid).toBe(true);
      });

      test('should accept array with different types', () => {
        const result = validateArray(['a', 1, true, {}], 'mixed');
        expect(result.valid).toBe(true);
      });

      test('should accept array with single element', () => {
        const result = validateArray(['only'], 'items', 1);
        expect(result.valid).toBe(true);
      });

      test('should accept large arrays', () => {
        const largeArray = Array(10000).fill(1);
        const result = validateArray(largeArray, 'items');
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid arrays', () => {
      test('should reject null', () => {
        const result = validateArray(null, 'items');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('items is required');
      });

      test('should reject undefined', () => {
        const result = validateArray(undefined, 'items');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('items is required');
      });

      test('should reject non-array types', () => {
        const result = validateArray('not-an-array' as any, 'items');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('items must be an array');
      });

      test('should reject object', () => {
        const result = validateArray({ length: 3 } as any, 'items');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('items must be an array');
      });

      test('should reject array shorter than minLength', () => {
        const result = validateArray([1, 2], 'items', 3);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('items must contain at least 3 element(s)');
      });

      test('should reject empty array when minLength > 0', () => {
        const result = validateArray([], 'groups', 1);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('groups must contain at least 1 element(s)');
      });

      test('should use custom field names in error messages', () => {
        const result = validateArray([], 'groupNames', 1);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('groupNames');
      });
    });

    describe('Edge cases', () => {
      test('should handle minLength of 0', () => {
        const result = validateArray([], 'optional', 0);
        expect(result.valid).toBe(true);
      });

      test('should handle array with null elements', () => {
        const result = validateArray([null, null], 'items');
        expect(result.valid).toBe(true);
      });

      test('should handle array with undefined elements', () => {
        const result = validateArray([undefined, undefined], 'items');
        expect(result.valid).toBe(true);
      });

      test('should handle nested arrays', () => {
        const result = validateArray([[1, 2], [3, 4]], 'matrix');
        expect(result.valid).toBe(true);
      });
    });

    describe('Real-world scenarios', () => {
      test('should validate groups array', () => {
        const groups = ['admin', 'users', 'guests'];
        const result = validateArray(groups, 'groups', 0);
        expect(result.valid).toBe(true);
      });

      test('should validate empty groups array is allowed', () => {
        const result = validateArray([], 'groups', 0);
        expect(result.valid).toBe(true);
      });

      test('should reject empty required groups array', () => {
        const result = validateArray([], 'groups', 1);
        expect(result.valid).toBe(false);
      });

      test('should validate tagIds array', () => {
        const tagIds = [
          '550e8400-e29b-41d4-a716-446655440000',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ];
        const result = validateArray(tagIds, 'tagIds');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Integration scenarios', () => {
    describe('Document API validation flow', () => {
      test('should validate complete document creation request', () => {
        const documentId = '550e8400-e29b-41d4-a716-446655440000';
        const teamId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        const appId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
        const documentType = 'team';

        const idResult = validateUUID(documentId, 'documentId');
        const teamResult = validateUUID(teamId, 'teamId');
        const appResult = validateUUID(appId, 'appId');
        const typeResult = validateEnum(documentType, DocumentType, 'documentType');

        expect(idResult.valid).toBe(true);
        expect(teamResult.valid).toBe(true);
        expect(appResult.valid).toBe(true);
        expect(typeResult.valid).toBe(true);
      });

      test('should validate document tags assignment', () => {
        const documentId = '550e8400-e29b-41d4-a716-446655440000';
        const tagIds = [
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        ];
        const documentType = 'base';

        const idResult = validateUUID(documentId, 'documentId');
        const tagsResult = validateUUIDArray(tagIds, 'tagIds');
        const typeResult = validateEnum(documentType, DocumentType, 'documentType');

        expect(idResult.valid).toBe(true);
        expect(tagsResult.valid).toBe(true);
        expect(typeResult.valid).toBe(true);
      });
    });

    describe('Application API validation flow', () => {
      test('should validate application creation request', () => {
        const appId = '550e8400-e29b-41d4-a716-446655440000';
        const name = 'My Application';
        const iconName = 'icon-app';
        const groupId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

        const idResult = validateUUID(appId, 'Application ID');
        const nameResult = validateString(name, 'Application name', 1, 255);
        const iconResult = validateString(iconName, 'Icon name', 1, 100);
        const groupResult = validateUUID(groupId, 'Group ID');

        expect(idResult.valid).toBe(true);
        expect(nameResult.valid).toBe(true);
        expect(iconResult.valid).toBe(true);
        expect(groupResult.valid).toBe(true);
      });

      test('should validate application with null groupId', () => {
        const groupId = null;
        
        // In real API, this would be conditionally validated
        if (groupId !== null && groupId !== undefined) {
          const groupResult = validateUUID(groupId, 'Group ID');
          expect(groupResult.valid).toBe(false);
        } else {
          // Null is acceptable for optional groupId
          expect(groupId).toBeNull();
        }
      });
    });

    describe('User management validation flow', () => {
      test('should validate user groups assignment', () => {
        const userId = '550e8400-e29b-41d4-a716-446655440000';
        const groups = ['admin', 'developers', 'testers'];

        const userIdResult = validateUUID(userId, 'userId');
        const groupsResult = validateArray(groups, 'groups', 0);

        expect(userIdResult.valid).toBe(true);
        expect(groupsResult.valid).toBe(true);
      });

      test('should validate user role update', () => {
        const userId = '550e8400-e29b-41d4-a716-446655440000';
        const role = 'admin';

        const userIdResult = validateUUID(userId, 'userId');
        const roleResult = validateEnum(role, ['admin', 'user'] as const, 'role');

        expect(userIdResult.valid).toBe(true);
        expect(roleResult.valid).toBe(true);
        expect(roleResult.value).toBe('admin');
      });
    });

    describe('File management validation flow', () => {
      test('should validate file operations', () => {
        const fileId = '550e8400-e29b-41d4-a716-446655440000';
        const visibility = 'private';

        const fileIdResult = validateUUID(fileId, 'fileId');
        const visibilityResult = validateEnum(visibility, FileVisibility, 'visibility');

        expect(fileIdResult.valid).toBe(true);
        expect(visibilityResult.valid).toBe(true);
      });
    });
  });

  describe('Performance and stress tests', () => {
    test('should handle validation of large UUID arrays efficiently', () => {
      const largeArray = Array(1000).fill('550e8400-e29b-41d4-a716-446655440000');
      const start = performance.now();
      const result = validateUUIDArray(largeArray, 'ids');
      const end = performance.now();

      expect(result.valid).toBe(true);
      expect(end - start).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test('should handle validation of very long strings efficiently', () => {
      const longString = 'a'.repeat(100000);
      const start = performance.now();
      const result = validateString(longString, 'text', 1, 100000);
      const end = performance.now();

      expect(result.valid).toBe(true);
      expect(end - start).toBeLessThan(100); // Should complete in less than 100ms
    });

    test('should handle multiple validations in sequence', () => {
      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        validateUUID('550e8400-e29b-41d4-a716-446655440000', 'id');
        validateEnum('admin', ['admin', 'user'] as const, 'role');
        validateString('test', 'name', 1, 100);
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe('validateUUIDArray with minLength parameter', () => {
    const validUUIDs = [
      '550e8400-e29b-41d4-a716-446655440000',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    ];

    describe('minLength = 0 (allow empty arrays)', () => {
      test('should accept empty array when minLength is 0', () => {
        const result = validateUUIDArray([], 'tagIds', false, 0);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept non-empty array when minLength is 0', () => {
        const result = validateUUIDArray([validUUIDs[0]], 'tagIds', false, 0);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should use 0 as minLength for optional parameters', () => {
        // Simulate optional tag filtering where empty array means "no filter"
        const optionalFilter: string[] = [];
        const result = validateUUIDArray(optionalFilter, 'filterIds', false, 0);
        expect(result.valid).toBe(true);
      });
    });

    describe('minLength = 1 (default, require at least one element)', () => {
      test('should reject empty array when minLength is 1', () => {
        const result = validateUUIDArray([], 'tagIds', false, 1);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must contain at least 1 element(s)');
      });

      test('should accept single element array', () => {
        const result = validateUUIDArray([validUUIDs[0]], 'tagIds', false, 1);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept multiple element array', () => {
        const result = validateUUIDArray(validUUIDs, 'tagIds', false, 1);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should use 1 as default minLength', () => {
        const result = validateUUIDArray([], 'tagIds');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must contain at least 1 element(s)');
      });
    });

    describe('minLength > 1 (require multiple elements)', () => {
      test('should reject empty array when minLength is 2', () => {
        const result = validateUUIDArray([], 'tagIds', false, 2);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must contain at least 2 element(s)');
      });

      test('should reject single element when minLength is 2', () => {
        const result = validateUUIDArray([validUUIDs[0]], 'tagIds', false, 2);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must contain at least 2 element(s)');
      });

      test('should accept array meeting minLength', () => {
        const result = validateUUIDArray([validUUIDs[0], validUUIDs[1]], 'tagIds', false, 2);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should accept array exceeding minLength', () => {
        const result = validateUUIDArray(validUUIDs, 'tagIds', false, 2);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      test('should enforce minLength of 5', () => {
        const result = validateUUIDArray([validUUIDs[0], validUUIDs[1]], 'requiredTags', false, 5);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('requiredTags must contain at least 5 element(s)');
      });
    });

    describe('minLength with strict UUID validation', () => {
      test('should validate minLength and UUID v4 format', () => {
        const v4UUIDs = [
          '550e8400-e29b-41d4-a716-446655440000',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ];
        const result = validateUUIDArray(v4UUIDs, 'tagIds', true, 2);
        expect(result.valid).toBe(true);
      });

      test('should reject when array meets minLength but has invalid UUID version', () => {
        const mixedVersions = [
          '550e8400-e29b-41d4-a716-446655440000', // v4
          'c232ab00-9414-11ec-b909-0242ac120002', // v1
        ];
        const result = validateUUIDArray(mixedVersions, 'tagIds', true, 2);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('tagIds[1]');
      });

      test('should reject when array below minLength with strict validation', () => {
        const result = validateUUIDArray(['550e8400-e29b-41d4-a716-446655440000'], 'tagIds', true, 2);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must contain at least 2 element(s)');
      });
    });

    describe('Real-world POST /api/documents/[documentId]/tags scenarios', () => {
      test('should validate tag assignment with at least one tag', () => {
        // Simulating POST request that requires at least one tag
        const tagIds = [
          '550e8400-e29b-41d4-a716-446655440000',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ];
        const result = validateUUIDArray(tagIds, 'tagIds', false, 1);
        expect(result.valid).toBe(true);
      });

      test('should reject empty tag array in POST request', () => {
        // POST endpoint requires at least one tag
        const tagIds: string[] = [];
        const result = validateUUIDArray(tagIds, 'tagIds', false, 1);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must contain at least 1 element(s)');
      });

      test('should validate single tag assignment', () => {
        const tagIds = ['550e8400-e29b-41d4-a716-446655440000'];
        const result = validateUUIDArray(tagIds, 'tagIds', false, 1);
        expect(result.valid).toBe(true);
      });
    });

    describe('Error message clarity', () => {
      test('should provide clear error for minLength 1', () => {
        const result = validateUUIDArray([], 'tagIds', false, 1);
        expect(result.error).toBe('tagIds must contain at least 1 element(s)');
      });

      test('should provide clear error for minLength 0 (should never fail on length)', () => {
        const result = validateUUIDArray([], 'optionalIds', false, 0);
        expect(result.valid).toBe(true);
      });

      test('should provide clear error for minLength 3', () => {
        const result = validateUUIDArray(['550e8400-e29b-41d4-a716-446655440000'], 'requiredIds', false, 3);
        expect(result.error).toBe('requiredIds must contain at least 3 element(s)');
      });

      test('should prioritize minLength error over invalid UUID error', () => {
        // When array is too short, should fail on length first
        const result = validateUUIDArray([], 'tagIds', false, 2);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must contain at least 2 element(s)');
      });

      test('should show UUID validation error when array meets minLength but has invalid UUID', () => {
        const result = validateUUIDArray(['550e8400-e29b-41d4-a716-446655440000', 'invalid'], 'tagIds', false, 2);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('tagIds[1]');
        expect(result.error).toContain('UUID');
      });
    });

    describe('Backward compatibility', () => {
      test('should default to minLength 1 when not specified', () => {
        const result = validateUUIDArray([], 'tagIds');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('tagIds must contain at least 1 element(s)');
      });

      test('should maintain existing behavior for non-empty valid arrays', () => {
        const result = validateUUIDArray([validUUIDs[0]], 'ids');
        expect(result.valid).toBe(true);
      });

      test('should maintain existing strict mode behavior', () => {
        const v1UUID = 'c232ab00-9414-11ec-b909-0242ac120002';
        const result = validateUUIDArray([v1UUID], 'ids', true);
        expect(result.valid).toBe(false);
      });
    });

    describe('Edge cases with minLength', () => {
      test('should handle minLength 0 with null', () => {
        const result = validateUUIDArray(null, 'ids', false, 0);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ids must be an array');
      });

      test('should handle minLength 0 with undefined', () => {
        const result = validateUUIDArray(undefined, 'ids', false, 0);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ids must be an array');
      });

      test('should handle very large minLength', () => {
        const result = validateUUIDArray([validUUIDs[0]], 'ids', false, 100);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ids must contain at least 100 element(s)');
      });

      test('should handle large array meeting large minLength', () => {
        const largeArray = Array(150).fill(validUUIDs[0]);
        const result = validateUUIDArray(largeArray, 'ids', false, 100);
        expect(result.valid).toBe(true);
      });
    });
  });
});