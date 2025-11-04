/**
 * Auth Config Test Suite
 * Tests for authentication provider configuration utilities
 */

describe('Auth Config', () => {
  // Save original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('getProviderName', () => {
    test('should return default provider name when env var is not set', () => {
      delete process.env.NEXT_PUBLIC_SSO_PROVIDER_NAME;
      const { getProviderName } = require('@/lib/auth/config');
      expect(getProviderName()).toBe("your organization's SSO");
    });

    test('should return custom provider name from env var', () => {
      process.env.NEXT_PUBLIC_SSO_PROVIDER_NAME = 'Custom SSO Provider';
      const { getProviderName } = require('@/lib/auth/config');
      expect(getProviderName()).toBe('Custom SSO Provider');
    });

    test('should return default when env var is empty string', () => {
      // Empty string is falsy, so it falls back to default
      process.env.NEXT_PUBLIC_SSO_PROVIDER_NAME = '';
      const { getProviderName } = require('@/lib/auth/config');
      expect(getProviderName()).toBe("your organization's SSO");
    });
  });

  describe('getProviderButtonText', () => {
    test('should return default button text when env var is not set', () => {
      delete process.env.NEXT_PUBLIC_SSO_PROVIDER_BUTTON_TEXT;
      const { getProviderButtonText } = require('@/lib/auth/config');
      expect(getProviderButtonText()).toBe('Continue with SSO');
    });

    test('should return custom button text from env var', () => {
      process.env.NEXT_PUBLIC_SSO_PROVIDER_BUTTON_TEXT = 'Sign in with Company';
      const { getProviderButtonText } = require('@/lib/auth/config');
      expect(getProviderButtonText()).toBe('Sign in with Company');
    });

    test('should return default when env var is empty string', () => {
      // Empty string is falsy, so it falls back to default
      process.env.NEXT_PUBLIC_SSO_PROVIDER_BUTTON_TEXT = '';
      const { getProviderButtonText } = require('@/lib/auth/config');
      expect(getProviderButtonText()).toBe('Continue with SSO');
    });
  });

  describe('getProviderDescription', () => {
    test('should return default description when env var is not set', () => {
      delete process.env.NEXT_PUBLIC_SSO_PROVIDER_DESCRIPTION;
      const { getProviderDescription } = require('@/lib/auth/config');
      expect(getProviderDescription()).toBe("Sign in with your organization's single sign-on");
    });

    test('should return custom description from env var', () => {
      process.env.NEXT_PUBLIC_SSO_PROVIDER_DESCRIPTION = 'Use your company credentials';
      const { getProviderDescription } = require('@/lib/auth/config');
      expect(getProviderDescription()).toBe('Use your company credentials');
    });

    test('should return default when env var is empty string', () => {
      // Empty string is falsy, so it falls back to default
      process.env.NEXT_PUBLIC_SSO_PROVIDER_DESCRIPTION = '';
      const { getProviderDescription } = require('@/lib/auth/config');
      expect(getProviderDescription()).toBe("Sign in with your organization's single sign-on");
    });
  });
});

