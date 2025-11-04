/**
 * WorkOS Client Test Suite
 * Tests for client-side WorkOS utilities
 */

describe('WorkOS Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('WORKOS_CLIENT_ID', () => {
    test('should return client ID from env var', () => {
      process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID = 'client_123';
      const { WORKOS_CLIENT_ID } = require('@/lib/workos/client');
      expect(WORKOS_CLIENT_ID).toBe('client_123');
    });

    test('should return empty string when env var is not set', () => {
      delete process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
      const { WORKOS_CLIENT_ID } = require('@/lib/workos/client');
      expect(WORKOS_CLIENT_ID).toBe('');
    });
  });

  describe('requireWorkOSClientId', () => {
    test('should return client ID when set', () => {
      process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID = 'client_123';
      const { requireWorkOSClientId } = require('@/lib/workos/client');
      expect(requireWorkOSClientId()).toBe('client_123');
    });

    test('should throw error when client ID is missing', () => {
      delete process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
      const { requireWorkOSClientId } = require('@/lib/workos/client');
      expect(() => requireWorkOSClientId()).toThrow('Missing NEXT_PUBLIC_WORKOS_CLIENT_ID environment variable');
    });
  });

  describe('REDIRECT_URI', () => {
    test('should return redirect URI from env var', () => {
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = 'https://example.com/callback';
      const { REDIRECT_URI } = require('@/lib/workos/client');
      expect(REDIRECT_URI).toBe('https://example.com/callback');
    });

    test('should return default redirect URI when env var is not set', () => {
      delete process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;
      const { REDIRECT_URI } = require('@/lib/workos/client');
      expect(REDIRECT_URI).toBe('http://localhost:3000/auth/callback');
    });
  });
});

