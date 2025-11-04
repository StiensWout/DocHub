/**
 * Token Refresh Test Suite
 * Tests for token refresh functionality
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
  userManagement: {
    refreshAccessToken: jest.fn(),
  },
};

jest.mock('@/lib/workos/server', () => ({
  workos: mockWorkOS,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Token Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshTokenIfNeeded', () => {
    test('should return null when no access token', async () => {
      mockCookieStore.get.mockReturnValue({ value: undefined });
      
      const { refreshTokenIfNeeded } = require('@/lib/auth/token-refresh');
      const result = await refreshTokenIfNeeded();
      
      expect(result).toBeNull();
    });

    test('should return token when token is not expired', async () => {
      // Create a valid JWT token that expires in 1 hour
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64');
      const token = `${header}.${payload}.signature`;
      
      mockCookieStore.get.mockImplementation((name) => {
        if (name === 'wos-session') return { value: token };
        return { value: undefined };
      });
      
      const { refreshTokenIfNeeded } = require('@/lib/auth/token-refresh');
      const result = await refreshTokenIfNeeded();
      
      expect(result).toBe(token);
      expect(mockWorkOS.userManagement.refreshAccessToken).not.toHaveBeenCalled();
    });

    test('should refresh token when it expires soon', async () => {
      // Create a JWT token that expires in 2 minutes (less than 5 minutes threshold)
      const nearFutureExp = Math.floor(Date.now() / 1000) + 120;
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ exp: nearFutureExp })).toString('base64');
      const oldToken = `${header}.${payload}.signature`;
      
      const newToken = 'new-refreshed-token';
      const newRefreshToken = 'new-refresh-token';
      
      mockCookieStore.get.mockImplementation((name) => {
        if (name === 'wos-session') return { value: oldToken };
        if (name === 'wos-refresh-token') return { value: 'refresh-token' };
        return { value: undefined };
      });
      
      mockWorkOS.userManagement.refreshAccessToken.mockResolvedValue({
        accessToken: newToken,
        refreshToken: newRefreshToken,
      });
      
      const { refreshTokenIfNeeded } = require('@/lib/auth/token-refresh');
      const result = await refreshTokenIfNeeded();
      
      expect(mockWorkOS.userManagement.refreshAccessToken).toHaveBeenCalledWith('refresh-token');
      expect(result).toBe(newToken);
    });

    test('should return old token when refresh fails', async () => {
      // Create a JWT token that expires soon
      const nearFutureExp = Math.floor(Date.now() / 1000) + 120;
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ exp: nearFutureExp })).toString('base64');
      const oldToken = `${header}.${payload}.signature`;
      
      mockCookieStore.get.mockImplementation((name) => {
        if (name === 'wos-session') return { value: oldToken };
        if (name === 'wos-refresh-token') return { value: 'refresh-token' };
        return { value: undefined };
      });
      
      mockWorkOS.userManagement.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'));
      
      const { refreshTokenIfNeeded } = require('@/lib/auth/token-refresh');
      const result = await refreshTokenIfNeeded();
      
      expect(result).toBe(oldToken); // Returns old token on failure
    });

    test('should return token when no refresh token available', async () => {
      // Create a JWT token that expires soon
      const nearFutureExp = Math.floor(Date.now() / 1000) + 120;
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ exp: nearFutureExp })).toString('base64');
      const token = `${header}.${payload}.signature`;
      
      mockCookieStore.get.mockImplementation((name) => {
        if (name === 'wos-session') return { value: token };
        return { value: undefined }; // No refresh token
      });
      
      const { refreshTokenIfNeeded } = require('@/lib/auth/token-refresh');
      const result = await refreshTokenIfNeeded();
      
      expect(result).toBe(token);
      expect(mockWorkOS.userManagement.refreshAccessToken).not.toHaveBeenCalled();
    });

    test('should handle invalid JWT format gracefully', async () => {
      const invalidToken = 'not-a-valid-jwt';
      
      mockCookieStore.get.mockImplementation((name) => {
        if (name === 'wos-session') return { value: invalidToken };
        return { value: undefined };
      });
      
      const { refreshTokenIfNeeded } = require('@/lib/auth/token-refresh');
      const result = await refreshTokenIfNeeded();
      
      // Should return the token even if it can't be decoded
      expect(result).toBe(invalidToken);
    });

    test('should handle token without exp claim', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ sub: 'user-123' })).toString('base64');
      const token = `${header}.${payload}.signature`;
      
      mockCookieStore.get.mockImplementation((name) => {
        if (name === 'wos-session') return { value: token };
        return { value: undefined };
      });
      
      const { refreshTokenIfNeeded } = require('@/lib/auth/token-refresh');
      const result = await refreshTokenIfNeeded();
      
      expect(result).toBe(token);
    });

    test('should handle error and return null', async () => {
      mockCookieStore.get.mockImplementation(() => {
        throw new Error('Cookie error');
      });
      
      const { refreshTokenIfNeeded } = require('@/lib/auth/token-refresh');
      const result = await refreshTokenIfNeeded();
      
      expect(result).toBeNull();
    });
  });
});

