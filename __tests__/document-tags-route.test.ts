/**
 * Document Tags Route API Tests
 * 
 * Tests for the /api/documents/[documentId]/tags endpoint covering:
 * - GET: Retrieve tags for a document
 * - POST: Associate tags with a document
 * - DELETE: Remove tag associations from a document
 * 
 * Tests focus on the usage of validatedDocumentType and the new validateUUIDArray
 * minLength parameter requirement for POST requests.
 */

// Mock Next.js server modules BEFORE importing anything else
// This prevents Request/Response initialization errors when importing route handlers
jest.mock('next/server', () => {
  // Ensure Request/Response are available before Next.js tries to use them
  if (typeof global.Request === 'undefined') {
    global.Request = class Request {
      constructor(input, init = {}) {
        this.url = typeof input === 'string' ? input : input.url;
        this.method = init.method || 'GET';
        this.headers = new Headers(init.headers);
        this.body = init.body || null;
        this.bodyUsed = false;
      }
      async json() { return JSON.parse(this.body || '{}'); }
      async text() { return this.body || ''; }
    };
  }
  
  if (typeof global.Response === 'undefined') {
    global.Response = class Response {
      constructor(body, init = {}) {
        this.body = body;
        this.status = init.status || 200;
        this.statusText = init.statusText || 'OK';
        this.headers = new Headers(init.headers);
        this.ok = this.status >= 200 && this.status < 300;
      }
      async json() { return typeof this.body === 'string' ? JSON.parse(this.body) : this.body; }
      async text() { return typeof this.body === 'string' ? this.body : JSON.stringify(this.body); }
    };
  }
  
  return {
    NextRequest: class NextRequest extends global.Request {
      constructor(input, init = {}) {
        super(input, init);
        this.nextUrl = init.nextUrl || {
          searchParams: new URLSearchParams(),
          pathname: typeof input === 'string' ? new URL(input).pathname : input.pathname || '/',
        };
      }
    },
    NextResponse: {
      json: (body, init) => new global.Response(JSON.stringify(body), init),
      redirect: (url, status) => new global.Response(null, { status: status || 307, headers: { Location: url } }),
    },
  };
});

import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  log: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

describe('Document Tags Route API', () => {
  const mockSession = { user: { id: 'user-123' } };
  const validDocumentId = '550e8400-e29b-41d4-a716-446655440000';
  const validTagIds = [
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/documents/[documentId]/tags', () => {
    describe('Authentication', () => {
      test('should return 401 when session is missing', async () => {
        (getSession as jest.Mock).mockResolvedValue(null);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await GET(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      test('should proceed with valid session', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await GET(mockRequest, { params: { documentId: validDocumentId } });

        expect(response.status).toBe(200);
      });
    });

    describe('Document ID validation', () => {
      test('should return 400 for invalid UUID format', async () => {
        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await GET(mockRequest, { params: { documentId: 'invalid-uuid' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('documentId');
        expect(data.error).toContain('UUID');
      });

      test('should return 400 for empty document ID', async () => {
        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await GET(mockRequest, { params: { documentId: '' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });

      test('should accept valid UUID', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await GET(mockRequest, { params: { documentId: validDocumentId } });

        expect(response.status).toBe(200);
      });
    });

    describe('Document type validation', () => {
      test('should default to "base" when type not provided', async () => {
        const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        await GET(mockRequest, { params: { documentId: validDocumentId } });

        // Verify the query used 'base' as document_type
        expect(mockEq).toHaveBeenCalledWith('document_type', 'base');
      });

      test('should use provided "team" document type', async () => {
        const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams('type=team') },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        await GET(mockRequest, { params: { documentId: validDocumentId } });

        // Verify the query used 'team' as document_type
        expect(mockEq).toHaveBeenCalledWith('document_type', 'team');
      });

      test('should reject invalid document type', async () => {
        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams('type=invalid') },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await GET(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('documentType');
        expect(data.error).toContain('base, team');
      });

      test('should use validatedDocumentType from validation result', async () => {
        const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams('type=base') },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        await GET(mockRequest, { params: { documentId: validDocumentId } });

        // The validated value should be used, not the raw input
        expect(mockEq).toHaveBeenCalledWith('document_type', 'base');
      });
    });

    describe('Successful tag retrieval', () => {
      test('should return empty array when no tags found', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await GET(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.tags).toEqual([]);
      });

      test('should return tags in correct format', async () => {
        const mockTags = [
          {
            tag_id: validTagIds[0],
            tags: { id: validTagIds[0], name: 'Important', slug: 'important', color: '#ff0000' },
          },
          {
            tag_id: validTagIds[1],
            tags: { id: validTagIds[1], name: 'Urgent', slug: 'urgent', color: '#ff9900' },
          },
        ];

        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockTags,
                error: null,
              }),
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await GET(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.tags).toHaveLength(2);
        expect(data.tags[0]).toEqual(mockTags[0].tags);
        expect(data.tags[1]).toEqual(mockTags[1].tags);
      });
    });

    describe('Database error handling', () => {
      test('should return 500 on database error', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await GET(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch document tags');
        expect(log.error).toHaveBeenCalled();
      });
    });
  });

  describe('POST /api/documents/[documentId]/tags', () => {
    describe('Authentication', () => {
      test('should return 401 when session is missing', async () => {
        (getSession as jest.Mock).mockResolvedValue(null);

        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: validTagIds }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Document ID validation', () => {
      test('should return 400 for invalid document UUID', async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: validTagIds }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: 'invalid-uuid' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('documentId');
      });
    });

    describe('Tag IDs validation with minLength requirement', () => {
      test('should reject empty tagIds array (minLength = 1)', async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: [] }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('tagIds');
        expect(data.error).toContain('at least 1');
      });

      test('should reject null tagIds', async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: null }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('tagIds');
        expect(data.error).toContain('array');
      });

      test('should reject undefined tagIds', async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({}),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('tagIds');
      });

      test('should accept single tag ID', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ tag_id: validTagIds[0], tags: { id: validTagIds[0], name: 'Test' } }],
              error: null,
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: [validTagIds[0]] }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });

        expect(response.status).toBe(201);
      });

      test('should accept multiple tag IDs', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: validTagIds.map((id) => ({ tag_id: id, tags: { id, name: 'Test' } })),
              error: null,
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: validTagIds }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });

        expect(response.status).toBe(201);
      });

      test('should reject tagIds with invalid UUID', async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: [validTagIds[0], 'invalid-uuid'] }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('tagIds');
        expect(data.error).toContain('[1]');
      });
    });

    describe('Document type validation', () => {
      test('should default to "base" when documentType not provided', async () => {
        const mockUpsert = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        });
        const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: [validTagIds[0]] }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        await POST(mockRequest, { params: { documentId: validDocumentId } });

        // Check that upsert was called with base document type
        const upsertCall = mockUpsert.mock.calls[0];
        expect(upsertCall[0][0].document_type).toBe('base');
      });

      test('should use provided "team" document type', async () => {
        const mockUpsert = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        });
        const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            tagIds: [validTagIds[0]],
            documentType: 'team',
          }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        await POST(mockRequest, { params: { documentId: validDocumentId } });

        // Check that upsert was called with team document type
        const upsertCall = mockUpsert.mock.calls[0];
        expect(upsertCall[0][0].document_type).toBe('team');
      });

      test('should reject invalid document type', async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            tagIds: [validTagIds[0]],
            documentType: 'invalid',
          }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('documentType');
      });

      test('should use validatedDocumentType in tag associations', async () => {
        const mockUpsert = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        });
        const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            tagIds: validTagIds,
            documentType: 'base',
          }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        await POST(mockRequest, { params: { documentId: validDocumentId } });

        // Verify all tag associations use the validated document type
        const upsertCall = mockUpsert.mock.calls[0];
        const tagAssociations = upsertCall[0];
        tagAssociations.forEach((assoc: any) => {
          expect(assoc.document_type).toBe('base');
          expect(assoc.document_id).toBe(validDocumentId);
        });
      });
    });

    describe('Successful tag association', () => {
      test('should return 201 with associated tags', async () => {
        const mockTags = validTagIds.map((id, index) => ({
          tag_id: id,
          tags: { id, name: `Tag ${index}`, slug: `tag-${index}`, color: '#000000' },
        }));

        const mockFrom = jest.fn().mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: mockTags,
              error: null,
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: validTagIds }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.tags).toHaveLength(2);
        expect(data.tags[0]).toEqual(mockTags[0].tags);
      });

      test('should use upsert with correct conflict resolution', async () => {
        const mockUpsert = jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        });
        const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: [validTagIds[0]] }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        await POST(mockRequest, { params: { documentId: validDocumentId } });

        // Verify upsert options
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            onConflict: 'document_id,document_type,tag_id',
            ignoreDuplicates: true,
          })
        );
      });
    });

    describe('Database error handling', () => {
      test('should return 500 on database error', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          json: jest.fn().mockResolvedValue({ tagIds: [validTagIds[0]] }),
        } as unknown as NextRequest;

        const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await POST(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to add tags to document');
        expect(log.error).toHaveBeenCalled();
      });
    });
  });

  describe('DELETE /api/documents/[documentId]/tags', () => {
    describe('Authentication', () => {
      test('should return 401 when session is missing', async () => {
        (getSession as jest.Mock).mockResolvedValue(null);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await DELETE(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Document ID validation', () => {
      test('should return 400 for invalid document UUID', async () => {
        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await DELETE(mockRequest, { params: { documentId: 'invalid-uuid' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('documentId');
      });
    });

    describe('Document type validation', () => {
      test('should default to "base" when type not provided', async () => {
        const mockDelete = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockEq = jest.fn().mockReturnValue({ delete: mockDelete });
        const mockFrom = jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        await DELETE(mockRequest, { params: { documentId: validDocumentId } });

        // Verify the query used 'base' as document_type
        expect(mockEq).toHaveBeenCalledWith('document_type', 'base');
      });

      test('should use validatedDocumentType from validation', async () => {
        const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockFrom = jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams('type=team') },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        await DELETE(mockRequest, { params: { documentId: validDocumentId } });

        // Verify the query used 'team' as document_type
        expect(mockEq).toHaveBeenCalledWith('document_type', 'team');
      });
    });

    describe('Delete all tags (no tagIds parameter)', () => {
      test('should delete all tags when tagIds not provided', async () => {
        const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockFrom = jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await DELETE(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        // Should NOT call .in() when deleting all tags
        expect(mockEq).not.toHaveBeenCalledWith(expect.stringContaining('in'));
      });
    });

    describe('Delete specific tags (with tagIds parameter)', () => {
      test('should delete only specified tags', async () => {
        const mockIn = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockFrom = jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: mockIn,
              }),
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const tagIdsParam = validTagIds.join(',');
        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams(`tagIds=${tagIdsParam}`) },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await DELETE(mockRequest, { params: { documentId: validDocumentId } });

        expect(response.status).toBe(200);
        expect(mockIn).toHaveBeenCalledWith('tag_id', validTagIds);
      });

      test('should validate each tag UUID in tagIds parameter', async () => {
        const tagIdsParam = `${validTagIds[0]},invalid-uuid`;
        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams(`tagIds=${tagIdsParam}`) },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await DELETE(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('tagId');
      });

      test('should handle single tag ID in tagIds parameter', async () => {
        const mockIn = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockFrom = jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: mockIn,
              }),
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams(`tagIds=${validTagIds[0]}`) },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await DELETE(mockRequest, { params: { documentId: validDocumentId } });

        expect(response.status).toBe(200);
        expect(mockIn).toHaveBeenCalledWith('tag_id', [validTagIds[0]]);
      });

      test('should trim whitespace from tag IDs', async () => {
        const mockIn = jest.fn().mockResolvedValue({ data: null, error: null });
        const mockFrom = jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                in: mockIn,
              }),
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const tagIdsParam = `  ${validTagIds[0]}  , ${validTagIds[1]}  `;
        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams(`tagIds=${tagIdsParam}`) },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await DELETE(mockRequest, { params: { documentId: validDocumentId } });

        expect(response.status).toBe(200);
        expect(mockIn).toHaveBeenCalledWith('tag_id', validTagIds);
      });
    });

    describe('Database error handling', () => {
      test('should return 500 on database error', async () => {
        const mockFrom = jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        });
        (supabaseAdmin.from as jest.Mock).mockImplementation(mockFrom);

        const mockRequest = {
          nextUrl: { searchParams: new URLSearchParams() },
        } as NextRequest;

        const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
        const response = await DELETE(mockRequest, { params: { documentId: validDocumentId } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to remove tags from document');
        expect(log.error).toHaveBeenCalled();
      });
    });
  });

  describe('Error handling for all endpoints', () => {
    test('GET should handle unexpected errors', async () => {
      (getSession as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const mockRequest = {
        nextUrl: { searchParams: new URLSearchParams() },
      } as NextRequest;

      const { GET } = await import('@/app/api/documents/[documentId]/tags/route');
      const response = await GET(mockRequest, { params: { documentId: validDocumentId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(log.error).toHaveBeenCalled();
    });

    test('POST should handle unexpected errors', async () => {
      (getSession as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ tagIds: [validTagIds[0]] }),
      } as unknown as NextRequest;

      const { POST } = await import('@/app/api/documents/[documentId]/tags/route');
      const response = await POST(mockRequest, { params: { documentId: validDocumentId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(log.error).toHaveBeenCalled();
    });

    test('DELETE should handle unexpected errors', async () => {
      (getSession as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const mockRequest = {
        nextUrl: { searchParams: new URLSearchParams() },
      } as NextRequest;

      const { DELETE } = await import('@/app/api/documents/[documentId]/tags/route');
      const response = await DELETE(mockRequest, { params: { documentId: validDocumentId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(log.error).toHaveBeenCalled();
    });
  });
});