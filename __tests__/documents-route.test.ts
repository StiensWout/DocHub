/**
 * Documents Route Test Suite
 * Tests for /api/documents GET endpoint
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

// Mock user groups
const mockGetUserGroups = jest.fn();
const mockIsAdmin = jest.fn();
jest.mock('@/lib/auth/user-groups', () => ({
  getUserGroups: mockGetUserGroups,
  isAdmin: mockIsAdmin,
}));

// Mock Supabase
const mockSupabaseAdmin = {
  from: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

// Mock validation
jest.mock('@/lib/validation/api-validation', () => ({
  validateUUID: jest.fn((value, name) => ({
    valid: true,
    error: null,
  })),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  log: {
    error: jest.fn(),
  },
}));

describe('Documents Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest.nextUrl.searchParams = new URLSearchParams();
  });

  describe('GET', () => {
    test('should return 401 when no session', async () => {
      mockGetSession.mockResolvedValue(null);
      
      const { GET } = require('@/app/api/documents/route');
      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost/api/documents');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(json.error).toBe('Unauthorized');
      expect(response.status).toBe(401);
    });

    test('should return 400 when teamId is missing', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123' },
        accessToken: 'token',
      });
      
      mockRequest.nextUrl.searchParams.set('appId', 'app-123');
      
      const { GET } = require('@/app/api/documents/route');
      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost/api/documents');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(json.error).toBe('teamId and appId are required');
      expect(response.status).toBe(400);
    });

    test('should return 400 when appId is missing', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123' },
        accessToken: 'token',
      });
      
      mockRequest.nextUrl.searchParams.set('teamId', 'team-123');
      
      const { GET } = require('@/app/api/documents/route');
      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost/api/documents');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(json.error).toBe('teamId and appId are required');
      expect(response.status).toBe(400);
    });

    test('should return 400 when UUID validation fails', async () => {
      const { validateUUID } = require('@/lib/validation/api-validation');
      validateUUID.mockReturnValueOnce({
        valid: false,
        error: 'Invalid UUID format',
      });
      
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123' },
        accessToken: 'token',
      });
      
      mockRequest.nextUrl.searchParams.set('teamId', 'invalid');
      mockRequest.nextUrl.searchParams.set('appId', 'app-123');
      
      const { GET } = require('@/app/api/documents/route');
      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost/api/documents');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(json.error).toBe('Invalid UUID format');
      expect(response.status).toBe(400);
    });

    test('should return documents for admin user', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123' },
        accessToken: 'token',
      });
      
      mockIsAdmin.mockResolvedValue(true);
      mockGetUserGroups.mockResolvedValue(['Admin']);
      
      const mockBaseDocs = [
        {
          id: 'doc-1',
          title: 'Base Doc 1',
          category: 'Category 1',
          content: 'Content 1',
          updated_at: new Date().toISOString(),
          application_id: 'app-123',
        },
      ];
      
      const mockTeamDocs = [
        {
          id: 'doc-2',
          title: 'Team Doc 1',
          category: 'Category 2',
          content: 'Content 2',
          updated_at: new Date().toISOString(),
          application_id: 'app-123',
        },
      ];
      
      const mockBaseQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockBaseDocs,
          error: null,
        }),
      };
      
      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTeamDocs,
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'base_documents') return mockBaseQuery;
        if (table === 'team_documents') return mockTeamQuery;
        return {};
      });
      
      mockRequest.nextUrl.searchParams.set('teamId', 'team-123');
      mockRequest.nextUrl.searchParams.set('appId', 'app-123');
      
      const { GET } = require('@/app/api/documents/route');
      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost/api/documents?teamId=team-123&appId=app-123');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(json.documents).toHaveLength(2);
      expect(json.isAdmin).toBe(true);
      expect(json.userGroups).toEqual(['Admin']);
      expect(json.documents[0].type).toBe('base');
      expect(json.documents[1].type).toBe('team');
    });

    test('should filter team documents by user groups for non-admin', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123' },
        accessToken: 'token',
      });
      
      mockIsAdmin.mockResolvedValue(false);
      mockGetUserGroups.mockResolvedValue(['Group1']);
      
      const mockBaseDocs = [
        {
          id: 'doc-1',
          title: 'Base Doc 1',
          category: 'Category 1',
          content: 'Content 1',
          updated_at: new Date().toISOString(),
          application_id: 'app-123',
        },
      ];
      
      const mockAccessibleDocs = [
        { team_document_id: 'doc-2' },
      ];
      
      const mockTeamDocs = [
        {
          id: 'doc-2',
          title: 'Team Doc 1',
          category: 'Category 2',
          content: 'Content 2',
          updated_at: new Date().toISOString(),
          application_id: 'app-123',
        },
      ];
      
      const mockBaseQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockBaseDocs,
          error: null,
        }),
      };
      
      const mockAccessQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockAccessibleDocs,
          error: null,
        }),
      };
      
      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTeamDocs,
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'base_documents') return mockBaseQuery;
        if (table === 'document_access_groups') return mockAccessQuery;
        if (table === 'team_documents') return mockTeamQuery;
        return {};
      });
      
      mockRequest.nextUrl.searchParams.set('teamId', 'team-123');
      mockRequest.nextUrl.searchParams.set('appId', 'app-123');
      
      const { GET } = require('@/app/api/documents/route');
      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost/api/documents?teamId=team-123&appId=app-123');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(json.documents).toHaveLength(2);
      expect(json.isAdmin).toBe(false);
      expect(json.userGroups).toEqual(['Group1']);
    });

    test('should return 500 on database error', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123' },
        accessToken: 'token',
      });
      
      mockIsAdmin.mockResolvedValue(true);
      mockGetUserGroups.mockResolvedValue(['Admin']);
      
      const mockBaseQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockBaseQuery);
      
      mockRequest.nextUrl.searchParams.set('teamId', 'team-123');
      mockRequest.nextUrl.searchParams.set('appId', 'app-123');
      
      const { GET } = require('@/app/api/documents/route');
      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost/api/documents?teamId=team-123&appId=app-123');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(json.error).toBe('Failed to fetch documents');
      expect(response.status).toBe(500);
    });

    test('should handle non-admin user with no groups', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-123' },
        accessToken: 'token',
      });
      
      mockIsAdmin.mockResolvedValue(false);
      mockGetUserGroups.mockResolvedValue([]);
      
      const mockBaseDocs = [
        {
          id: 'doc-1',
          title: 'Base Doc 1',
          category: 'Category 1',
          content: 'Content 1',
          updated_at: new Date().toISOString(),
          application_id: 'app-123',
        },
      ];
      
      const mockBaseQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockBaseDocs,
          error: null,
        }),
      };
      
      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'base_documents') return mockBaseQuery;
        if (table === 'team_documents') return mockTeamQuery;
        return {};
      });
      
      mockRequest.nextUrl.searchParams.set('teamId', 'team-123');
      mockRequest.nextUrl.searchParams.set('appId', 'app-123');
      
      const { GET } = require('@/app/api/documents/route');
      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost/api/documents?teamId=team-123&appId=app-123');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(json.documents).toHaveLength(1);
      expect(json.documents[0].type).toBe('base');
    });
  });
});

