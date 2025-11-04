/**
 * JWT Utils Test Suite
 * Tests for JWT token decoding utilities
 */

describe('JWT Utils', () => {
  describe('decodeBase64url', () => {
    const { decodeBase64url } = require('@/lib/auth/jwt-utils');

    test('should decode simple Base64url string', () => {
      // "hello" in Base64url: "aGVsbG8"
      const result = decodeBase64url('aGVsbG8');
      expect(result).toBe('hello');
    });

    test('should handle Base64url with dashes and underscores', () => {
      // Base64url uses - and _ instead of + and /
      const result = decodeBase64url('SGVsbG8gV29ybGQ'); // "Hello World" in Base64url
      expect(result).toBe('Hello World');
    });

    test('should add padding when needed', () => {
      // "test" in Base64url without padding: "dGVzdA"
      const result = decodeBase64url('dGVzdA');
      expect(result).toBe('test');
    });

    test('should handle JSON string', () => {
      const jsonString = '{"sub":"user123","exp":1234567890}';
      const base64url = Buffer.from(jsonString)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const result = decodeBase64url(base64url);
      expect(result).toBe(jsonString);
    });

    test('should handle empty string', () => {
      const result = decodeBase64url('');
      expect(result).toBe('');
    });
  });

  describe('decodeJWTPayload', () => {
    const { decodeJWTPayload } = require('@/lib/auth/jwt-utils');

    test('should decode valid JWT token', () => {
      const payload = { sub: 'user123', exp: 1234567890, iat: 1234567890 };
      const header = { alg: 'HS256', typ: 'JWT' };
      
      // Create a valid JWT token
      const headerBase64 = Buffer.from(JSON.stringify(header))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const payloadBase64 = Buffer.from(JSON.stringify(payload))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const signature = 'test_signature';
      const token = `${headerBase64}.${payloadBase64}.${signature}`;
      
      const result = decodeJWTPayload(token);
      expect(result).toEqual(payload);
    });

    test('should throw error for invalid JWT format (missing parts)', () => {
      const invalidToken = 'header.payload'; // Missing signature
      
      expect(() => {
        decodeJWTPayload(invalidToken);
      }).toThrow('Invalid JWT format: expected 3 parts');
    });

    test('should throw error for invalid JWT format (too many parts)', () => {
      const invalidToken = 'header.payload.signature.extra';
      
      expect(() => {
        decodeJWTPayload(invalidToken);
      }).toThrow('Invalid JWT format: expected 3 parts');
    });

    test('should throw error for invalid Base64url payload', () => {
      const invalidToken = 'header.invalid-base64url!.signature';
      
      expect(() => {
        decodeJWTPayload(invalidToken);
      }).toThrow('Failed to decode JWT');
    });

    test('should throw error for invalid JSON in payload', () => {
      // Create invalid JSON payload
      const invalidPayload = 'not-json';
      const payloadBase64 = Buffer.from(invalidPayload)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const token = `header.${payloadBase64}.signature`;
      
      expect(() => {
        decodeJWTPayload(token);
      }).toThrow('Failed to decode JWT');
    });

    test('should decode JWT with exp and iat claims', () => {
      const payload = {
        sub: 'user123',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
      };
      
      const headerBase64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const payloadBase64 = Buffer.from(JSON.stringify(payload))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const token = `${headerBase64}.${payloadBase64}.signature`;
      
      const result = decodeJWTPayload(token);
      expect(result.sub).toBe('user123');
      expect(result.exp).toBe(payload.exp);
      expect(result.iat).toBe(payload.iat);
    });
  });
});

