/**
 * Auth Signout Route Test Suite
 * Tests for /api/auth/signout endpoint
 */

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => {
      const response = {
        json: () => Promise.resolve(data),
        status: init?.status || 200,
        cookies: {
          delete: jest.fn(),
        },
      };
      return response;
    }),
  },
}));

describe('Auth Signout Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should delete session cookies and return success', async () => {
    const { POST } = require('@/app/api/auth/signout/route');
    const { NextRequest, NextResponse } = require('next/server');
    const request = new NextRequest('http://localhost/api/auth/signout');
    
    const response = await POST(request);
    const json = await response.json();
    
    expect(json.success).toBe(true);
    expect(response.status).toBe(200);
    expect(response.cookies.delete).toHaveBeenCalledWith('wos-session');
    expect(response.cookies.delete).toHaveBeenCalledWith('wos-refresh-token');
  });
});

