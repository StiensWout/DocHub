/**
 * Auth Session Route Test Suite
 * Tests for /api/auth/session endpoint
 */

// Mock Next.js Request
const mockRequest = {
  nextUrl: {
    searchParams: new URLSearchParams(),
  },
};

jest.mock('next/server', () => ({
  NextRequest: jest.fn(() => mockRequest),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    })),
  },
}));

// Mock session
const mockGetSession = jest.fn();
jest.mock('@/lib/auth/session', () => ({
  getSession: mockGetSession,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  log: {
    error: jest.fn(),
  },
}));

describe('Auth Session Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return authenticated false when no session', async () => {
    mockGetSession.mockResolvedValue(null);
      
    const { GET } = require('@/app/api/auth/session/route');
    const { NextRequest, NextResponse } = require('next/server');
    const request = new NextRequest('http://localhost/api/auth/session');
    
    const response = await GET(request);
    const json = await response.json();
    
    expect(json.authenticated).toBe(false);
    expect(response.status).toBe(200);
  });

  test('should return authenticated true with user when session exists', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      accessToken: 'token-123',
    };
    
    mockGetSession.mockResolvedValue(mockSession);
    
    const { GET } = require('@/app/api/auth/session/route');
    const { NextRequest } = require('next/server');
    const request = new NextRequest('http://localhost/api/auth/session');
    
    const response = await GET(request);
    const json = await response.json();
    
    expect(json.authenticated).toBe(true);
    expect(json.user).toEqual(mockSession.user);
    expect(response.status).toBe(200);
  });

  test('should return error on exception', async () => {
    mockGetSession.mockRejectedValue(new Error('Session error'));
    
    const { GET } = require('@/app/api/auth/session/route');
    const { NextRequest } = require('next/server');
    const request = new NextRequest('http://localhost/api/auth/session');
    
    const response = await GET(request);
    const json = await response.json();
    
    expect(json.authenticated).toBe(false);
    expect(json.error).toBe('Failed to check session');
    expect(response.status).toBe(500);
  });
});

