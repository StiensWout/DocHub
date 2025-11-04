/**
 * Session Test Suite
 * Tests for session management functions
 */

// Mock Next.js cookies
const mockCookieStore = {
  get: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock WorkOS client
const mockWorkOS = {
  sso: {
    getProfile: jest.fn(),
  },
  userManagement: {
    getUser: jest.fn(),
  },
};

jest.mock('@/lib/workos/server', () => ({
  workos: mockWorkOS,
}));

// Mock JWT utils
jest.mock('@/lib/auth/jwt-utils', () => ({
  decodeJWTPayload: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    test('should return null when no access token in cookies', async () => {
      mockCookieStore.get.mockReturnValue({ value: undefined });
      
      const { getSession } = require('@/lib/auth/session');
      const result = await getSession();
      
      expect(result).toBeNull();
    });

    test('should return null when cookie is not set', async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      
      const { getSession } = require('@/lib/auth/session');
      const result = await getSession();
      
      expect(result).toBeNull();
    });

    test('should return SSO profile when valid SSO token provided', async () => {
      const accessToken = 'sso-token-123';
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockCookieStore.get.mockReturnValue({ value: accessToken });
      mockWorkOS.sso.getProfile.mockResolvedValue(mockProfile);

      const { getSession } = require('@/lib/auth/session');
      const result = await getSession();

      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          profilePictureUrl: undefined,
        },
        accessToken,
      });
      expect(mockWorkOS.sso.getProfile).toHaveBeenCalledWith({ accessToken });
    });

    test('should return User Management profile when SSO fails', async () => {
      const accessToken = 'user-mgmt-token-123';
      const mockUser = {
        id: 'user-456',
        email: 'user2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        profilePictureUrl: 'https://example.com/avatar.jpg',
      };

      const { decodeJWTPayload } = require('@/lib/auth/jwt-utils');

      mockCookieStore.get.mockReturnValue({ value: accessToken });
      mockWorkOS.sso.getProfile.mockRejectedValue(new Error('Not SSO token'));
      decodeJWTPayload.mockReturnValue({ sub: 'user-456' });
      mockWorkOS.userManagement.getUser.mockResolvedValue(mockUser);

      const { getSession } = require('@/lib/auth/session');
      const result = await getSession();

      expect(result).toEqual({
        user: {
          id: 'user-456',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          profilePictureUrl: 'https://example.com/avatar.jpg',
        },
        accessToken,
      });
      expect(mockWorkOS.userManagement.getUser).toHaveBeenCalledWith('user-456');
    });

    test('should return null when token is expired', async () => {
      const accessToken = 'expired-token';
      const { decodeJWTPayload } = require('@/lib/auth/jwt-utils');

      // Mock expired token (exp is in the past)
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      decodeJWTPayload.mockReturnValue({ exp: expiredTime });

      mockCookieStore.get.mockReturnValue({ value: accessToken });

      const { getSession } = require('@/lib/auth/session');
      const result = await getSession();

      expect(result).toBeNull();
    });

    test('should return null when both SSO and User Management fail', async () => {
      const accessToken = 'invalid-token';
      const { decodeJWTPayload } = require('@/lib/auth/jwt-utils');

      mockCookieStore.get.mockReturnValue({ value: accessToken });
      mockWorkOS.sso.getProfile.mockRejectedValue(new Error('Invalid SSO token'));
      decodeJWTPayload.mockReturnValue({ sub: 'user-999' });
      mockWorkOS.userManagement.getUser.mockRejectedValue(new Error('User not found'));

      const { getSession } = require('@/lib/auth/session');
      const result = await getSession();

      expect(result).toBeNull();
    });

    test('should handle SSO profile with missing optional fields', async () => {
      const accessToken = 'sso-token';
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        // firstName and lastName are missing
      };

      mockCookieStore.get.mockReturnValue({ value: accessToken });
      mockWorkOS.sso.getProfile.mockResolvedValue(mockProfile);

      const { getSession } = require('@/lib/auth/session');
      const result = await getSession();

      expect(result?.user).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        firstName: undefined,
        lastName: undefined,
        profilePictureUrl: undefined,
      });
    });

    test('should handle User Management user with missing optional fields', async () => {
      const accessToken = 'user-mgmt-token';
      const mockUser = {
        id: 'user-456',
        email: 'user2@example.com',
        // firstName, lastName, profilePictureUrl are missing
      };

      const { decodeJWTPayload } = require('@/lib/auth/jwt-utils');

      mockCookieStore.get.mockReturnValue({ value: accessToken });
      mockWorkOS.sso.getProfile.mockRejectedValue(new Error('Not SSO token'));
      decodeJWTPayload.mockReturnValue({ sub: 'user-456' });
      mockWorkOS.userManagement.getUser.mockResolvedValue(mockUser);

      const { getSession } = require('@/lib/auth/session');
      const result = await getSession();

      expect(result?.user).toEqual({
        id: 'user-456',
        email: 'user2@example.com',
        firstName: undefined,
        lastName: undefined,
        profilePictureUrl: undefined,
      });
    });

    test('should return null when User Management fails to decode user ID', async () => {
      const accessToken = 'invalid-token';
      const { decodeJWTPayload } = require('@/lib/auth/jwt-utils');

      mockCookieStore.get.mockReturnValue({ value: accessToken });
      mockWorkOS.sso.getProfile.mockRejectedValue(new Error('Not SSO token'));
      decodeJWTPayload.mockReturnValue({}); // No 'sub' claim

      const { getSession } = require('@/lib/auth/session');
      const result = await getSession();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    test('should return true when session exists', async () => {
      const accessToken = 'valid-token';
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
      };

      mockCookieStore.get.mockReturnValue({ value: accessToken });
      mockWorkOS.sso.getProfile.mockResolvedValue(mockProfile);

      const { isAuthenticated } = require('@/lib/auth/session');
      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    test('should return false when session is null', async () => {
      mockCookieStore.get.mockReturnValue({ value: undefined });

      const { isAuthenticated } = require('@/lib/auth/session');
      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    test('should return user when session exists', async () => {
      const accessToken = 'valid-token';
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockCookieStore.get.mockReturnValue({ value: accessToken });
      mockWorkOS.sso.getProfile.mockResolvedValue(mockProfile);

      const { getCurrentUser } = require('@/lib/auth/session');
      const result = await getCurrentUser();

      expect(result).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profilePictureUrl: undefined,
      });
    });

    test('should throw error when session is null', async () => {
      mockCookieStore.get.mockReturnValue({ value: undefined });

      const { getCurrentUser } = require('@/lib/auth/session');
      
      await expect(getCurrentUser()).rejects.toThrow('User is not authenticated');
    });
  });
});

