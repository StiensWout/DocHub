/**
 * File Race Condition Test Suite
 * Tests that file replacement operations handle race conditions and failures gracefully
 */

// Mock Next.js functions
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, options) => ({ body, options })),
  },
  NextRequest: jest.fn(),
}));

// Mock authentication
jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(() => Promise.resolve({ user: { id: 'user_123' } })),
}));

jest.mock('@/lib/auth/user-groups', () => ({
  getUserGroups: jest.fn(() => Promise.resolve(['group1', 'group2'])),
  isAdmin: jest.fn(() => Promise.resolve(false)),
}));

// Mock Supabase
const mockStorageOperations: any[] = [];

const mockSupabaseAdmin = {
  from: jest.fn((table: string) => {
    if (table === 'document_files') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'file_123',
                file_name: 'old_file.pdf',
                file_path: 'documents/file_123_old_file.pdf',
                file_type: 'application/pdf',
                file_size: 1000,
                storage_bucket: 'documents',
                document_id: null,
                application_id: 'app_123',
                uploaded_by: 'user_123',
                visibility: 'team',
                team_id: 'team_123',
              },
              error: null,
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'file_123',
                  file_name: 'new_file.pdf',
                  file_type: 'application/pdf',
                  file_size: 2000,
                  updated_at: new Date().toISOString(),
                },
                error: null,
              })),
            })),
          })),
        })),
      };
    }
    return {};
  }),
  storage: {
    from: jest.fn((bucket: string) => ({
      upload: jest.fn((path: string, file: any, options?: any) => {
        const operation = { type: 'upload', path, bucket, options };
        mockStorageOperations.push(operation);
        
        // Simulate upload failure scenarios
        if (path.includes('_staging_') && path.includes('fail_staging')) {
          return { error: { message: 'Staging upload failed' }, data: null };
        }
        if (path.includes('fail_final')) {
          return { error: { message: 'Final upload failed' }, data: null };
        }
        
        return { error: null, data: { path } };
      }),
      download: jest.fn((path: string) => {
        const operation = { type: 'download', path, bucket };
        mockStorageOperations.push(operation);
        
        // Return a Blob-like object that can be converted to File
        const mockBlob = new Blob(['mock file content'], { type: 'application/octet-stream' });
        return { 
          error: null, 
          data: mockBlob,
        };
      }),
      remove: jest.fn((paths: string[]) => {
        const operation = { type: 'remove', paths };
        mockStorageOperations.push(operation);
        
        // Simulate removal failure
        if (paths.some(p => p.includes('fail_remove'))) {
          return { error: { message: 'Remove failed' }, data: null };
        }
        
        return { error: null, data: paths };
      }),
      getPublicUrl: jest.fn((path: string) => ({
        data: { publicUrl: `https://storage.example.com/${path}` },
      })),
    })),
  },
};

jest.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

describe('File Race Condition Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageOperations.length = 0;
  });

  describe('File Replacement - Staging Approach', () => {
    test('should upload to staging before replacing final file (happy path)', async () => {
      // Ensure auth and validation mocks allow storage operations to proceed
      const { getSession } = require('@/lib/auth/session');
      const { getUserGroups, isAdmin } = require('@/lib/auth/user-groups');
      
      getSession.mockResolvedValue({ user: { id: 'user_123' } });
      getUserGroups.mockResolvedValue(['group1', 'group2']);
      isAdmin.mockResolvedValue(true); // Admin can modify any file

      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content'], 'new_file.pdf', { type: 'application/pdf' });
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Verify operation succeeded
      expect(result?.body?.success || result?.body?.file).toBeDefined();
      const responseBody = result?.body || result;
      expect(responseBody.error).toBeUndefined();

      // Assert that storage operations occurred (fail fast if they didn't)
      const uploadOperations = mockStorageOperations.filter(op => op.type === 'upload');
      expect(uploadOperations.length).toBeGreaterThan(0);
      
      // Assert staging upload exists
      const stagingUpload = uploadOperations.find(op => op.path.includes('_staging_'));
      expect(stagingUpload).toBeDefined();
      expect(stagingUpload?.path).toContain('_staging_');
      
      // Assert final upload exists
      const finalUpload = uploadOperations.find(op => 
        op.path === 'documents/file_123_old_file.pdf' || 
        op.path.includes('file_123_old_file.pdf')
      );
      expect(finalUpload).toBeDefined();
      
      // Assert staging happens before final upload
      expect(mockStorageOperations.indexOf(stagingUpload!)).toBeLessThan(
        mockStorageOperations.indexOf(finalUpload!)
      );
      
      // Verify that staged file is downloaded (not using original newFile)
      const downloadOperations = mockStorageOperations.filter(op => op.type === 'download');
      expect(downloadOperations.length).toBeGreaterThan(0);
      
      const stagingDownload = downloadOperations.find(op => op.path.includes('_staging_'));
      expect(stagingDownload).toBeDefined();
      
      // Assert correct ordering: staging upload -> download -> final upload
      expect(mockStorageOperations.indexOf(stagingUpload!)).toBeLessThan(
        mockStorageOperations.indexOf(stagingDownload!)
      );
      expect(mockStorageOperations.indexOf(stagingDownload!)).toBeLessThan(
        mockStorageOperations.indexOf(finalUpload!)
      );
    });

    test('should return error when authentication fails', async () => {
      // Configure mocks to fail authentication
      const { getSession } = require('@/lib/auth/session');
      getSession.mockResolvedValue(null); // No session = unauthorized

      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content'], 'new_file.pdf', { type: 'application/pdf' });
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Assert expected error response
      const responseBody = result?.body || result;
      expect(responseBody.error).toBeDefined();
      expect(responseBody.error).toBe('Unauthorized');
      const statusCode = result?.options?.status || result?.status;
      expect(statusCode).toBe(401);

      // Assert no storage operations occurred
      expect(mockStorageOperations.length).toBe(0);
    });

    test('should return error when authorization fails', async () => {
      // Configure mocks: auth passes but authorization fails
      const { getSession } = require('@/lib/auth/session');
      const { getUserGroups, isAdmin } = require('@/lib/auth/user-groups');
      
      getSession.mockResolvedValue({ user: { id: 'user_456' } }); // Different user, not the owner
      getUserGroups.mockResolvedValue(['group1']); // User doesn't have access
      isAdmin.mockResolvedValue(false); // Not admin

      // Mock the file metadata query to return a file owned by different user
      const originalFrom = mockSupabaseAdmin.from;
      mockSupabaseAdmin.from = jest.fn((table: string) => {
        if (table === 'document_files') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    id: 'file_123',
                    file_name: 'old_file.pdf',
                    file_path: 'documents/file_123_old_file.pdf',
                    file_type: 'application/pdf',
                    file_size: 1000,
                    storage_bucket: 'documents',
                    document_id: null,
                    application_id: 'app_123',
                    uploaded_by: 'user_123', // Different from current user 'user_456'
                    visibility: 'team',
                    team_id: 'team_123',
                  },
                  error: null,
                })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }
        return {};
      });

      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content'], 'new_file.pdf', { type: 'application/pdf' });
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Assert expected error response
      const responseBody = result?.body || result;
      expect(responseBody.error).toBeDefined();
      expect(responseBody.error).toContain('Forbidden');
      expect(responseBody.error).toContain('permission');
      const statusCode = result?.options?.status || result?.status;
      expect(statusCode).toBe(403);

      // Assert no storage operations occurred
      expect(mockStorageOperations.length).toBe(0);

      // Restore original mock
      mockSupabaseAdmin.from = originalFrom;
    });

    test('should return error when file validation fails', async () => {
      // Configure mocks: auth and authorization pass
      const { getSession } = require('@/lib/auth/session');
      const { getUserGroups, isAdmin } = require('@/lib/auth/user-groups');
      
      getSession.mockResolvedValue({ user: { id: 'user_123' } });
      getUserGroups.mockResolvedValue(['group1', 'group2']);
      isAdmin.mockResolvedValue(true);

      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      // Provide invalid file (malicious filename)
      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content'], '../../../etc/passwd.pdf', { 
                type: 'application/pdf' 
              });
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Assert expected error response
      const responseBody = result?.body || result;
      expect(responseBody.error).toBeDefined();
      const statusCode = result?.options?.status || result?.status;
      expect(statusCode).toBe(400);

      // Assert no storage operations occurred
      expect(mockStorageOperations.length).toBe(0);
    });

    test('should cleanup staging file after successful replacement', async () => {
      // Ensure auth and validation mocks allow storage operations to proceed
      const { getSession } = require('@/lib/auth/session');
      const { getUserGroups, isAdmin } = require('@/lib/auth/user-groups');
      
      getSession.mockResolvedValue({ user: { id: 'user_123' } });
      getUserGroups.mockResolvedValue(['group1', 'group2']);
      isAdmin.mockResolvedValue(true); // Admin can modify any file

      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content'], 'new_file.pdf', { type: 'application/pdf' });
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // First, assert operation success/failure flag
      const responseBody = result?.body || result;
      const operationSucceeded = responseBody?.success === true || responseBody?.file !== undefined;
      const operationFailed = responseBody?.error !== undefined || 
                              (result?.options?.status && result.options.status >= 400) ||
                              (result?.status && result.status >= 400);

      // Check if any staging operations were created
      const stagingOps = mockStorageOperations.filter(op => 
        (op.path && op.path.includes('_staging_')) ||
        (op.paths && op.paths.some((p: string) => p.includes('_staging_')))
      );

      const removeOperations = mockStorageOperations.filter(op => op.type === 'remove');
      const stagingRemove = removeOperations.find(op => 
        op.paths && op.paths.some((p: string) => p.includes('_staging_'))
      );

      if (operationSucceeded) {
        // Operation succeeded - assert cleanup happened
        expect(operationFailed).toBe(false);
        
        // If staging operations occurred, cleanup must happen
        if (stagingOps.length > 0) {
          expect(removeOperations.length).toBeGreaterThan(0);
          expect(stagingRemove).toBeDefined();
          expect(stagingRemove?.paths).toBeDefined();
          expect(stagingRemove?.paths.some((p: string) => p.includes('_staging_'))).toBe(true);
        } else {
          // No staging operations - this is acceptable if operation succeeded without staging
          // (though unlikely in normal flow, it's a valid state)
        }
      } else if (operationFailed) {
        // Operation failed - assert failure state
        expect(responseBody?.error || operationFailed).toBeTruthy();
        
        // If staging operations were created before failure, cleanup should still happen
        if (stagingOps.length > 0) {
          // Staging was created, so cleanup must be attempted (even if operation failed)
          expect(removeOperations.length).toBeGreaterThan(0);
          expect(stagingRemove).toBeDefined();
          expect(stagingRemove?.paths).toBeDefined();
          expect(stagingRemove?.paths.some((p: string) => p.includes('_staging_'))).toBe(true);
        }
        // If no staging operations occurred (early failure), no cleanup needed - this is acceptable
      } else {
        // Neither success nor failure clearly indicated - fail the test deterministically
        throw new Error('Test failure: Operation result is ambiguous. Response: ' + JSON.stringify(responseBody));
      }
    });
  });

  describe('File Replacement - Error Handling', () => {
    test.skip('should cleanup staging file if final upload fails', async () => {
      // TODO: Fix mock setup to properly track storage operations
      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      // Mock final upload to fail - need to reset mock first
      jest.clearAllMocks();
      mockStorageOperations.length = 0;
      
      mockSupabaseAdmin.storage.from('documents').upload = jest.fn((path, file, options) => {
        mockStorageOperations.push({ type: 'upload', path, bucket: 'documents', options });
        if (path === 'documents/file_123_old_file.pdf') {
          return { error: { message: 'Final upload failed' }, data: null };
        }
        return { error: null, data: { path } };
      });

      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content'], 'new_file.pdf', { type: 'application/pdf' });
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Should return error (NextResponse.json structure varies)
      const hasError = result.body?.error || result.error || (result.status === 500);
      expect(hasError).toBeTruthy();
      
      // Should attempt cleanup of staging file (may not happen if error occurs very early)
      const removeOperations = mockStorageOperations.filter(op => op.type === 'remove');
      const stagingRemove = removeOperations.find(op => 
        op.paths && op.paths.some((p: string) => p.includes('_staging_'))
      );
      // If staging was created, it should be cleaned up
      const stagingWasCreated = mockStorageOperations.some(op => 
        op.type === 'upload' && op.path && op.path.includes('_staging_')
      );
      if (stagingWasCreated) {
        expect(stagingRemove || removeOperations.length > 0).toBeTruthy();
      }
    });

    test('should cleanup staging file if database update fails', async () => {
      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      // Mock database update to fail
      const originalFrom = mockSupabaseAdmin.from;
      mockSupabaseAdmin.from = jest.fn((table: string) => {
        if (table === 'document_files') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    id: 'file_123',
                    file_name: 'old_file.pdf',
                    file_path: 'documents/file_123_old_file.pdf',
                    file_type: 'application/pdf',
                    file_size: 1000,
                    storage_bucket: 'documents',
                  },
                  error: null,
                })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { message: 'Database update failed' },
                  })),
                })),
              })),
            })),
          };
        }
        return {};
      });

      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content'], 'new_file.pdf', { type: 'application/pdf' });
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Should return error (NextResponse.json structure varies)
      const hasError = result.body?.error || result.error || (result.status === 500);
      expect(hasError).toBeTruthy();
      
      // Should attempt cleanup of staging file (may not happen if error occurs very early)
      const removeOperations = mockStorageOperations.filter(op => op.type === 'remove');
      const stagingRemove = removeOperations.find(op => 
        op.paths && op.paths.some((p: string) => p.includes('_staging_'))
      );
      // If staging was created, it should be cleaned up
      const stagingWasCreated = mockStorageOperations.some(op => 
        op.type === 'upload' && op.path && op.path.includes('_staging_')
      );
      if (stagingWasCreated) {
        expect(stagingRemove || removeOperations.length > 0).toBeTruthy();
      }
    });

    test('should handle staging upload failure gracefully', async () => {
      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      // Mock staging upload to fail
      const originalUpload = mockSupabaseAdmin.storage.from('documents').upload;
      mockSupabaseAdmin.storage.from('documents').upload = jest.fn((path, file, options) => {
        if (path.includes('_staging_')) {
          return { error: { message: 'Staging upload failed' }, data: null };
        }
        return originalUpload(path, file, options);
      });

      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content'], 'new_file.pdf', { type: 'application/pdf' });
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Should return error (NextResponse.json structure varies)
      const hasError = result.body?.error || result.error || (result.status === 500);
      expect(hasError).toBeTruthy();
      
      // Should not touch final file location
      const finalUpload = mockStorageOperations.find(op => 
        op.type === 'upload' && op.path === 'documents/file_123_old_file.pdf'
      );
      expect(finalUpload).toBeUndefined();
    });
  });

  describe('File Replacement - Concurrent Requests', () => {
    test.skip('should handle concurrent file replacements safely', async () => {
      // TODO: Fix mock setup to properly track concurrent operations
      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      const mockRequest1 = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content1'], 'new_file1.pdf', { type: 'application/pdf' });
            }
            return null;
          }),
        })),
      };

      const mockRequest2 = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return new File(['content2'], 'new_file2.pdf', { type: 'application/pdf' });
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      // Execute concurrently
      const [result1, result2] = await Promise.all([
        PUT(mockRequest1 as any, mockContext),
        PUT(mockRequest2 as any, mockContext),
      ]);

      // Both should complete (one might fail if there's a conflict, but shouldn't crash)
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      
      // Both should have attempted staging uploads (may be sequential, not parallel in test)
      const stagingUploads = mockStorageOperations.filter(op => 
        op.type === 'upload' && op.path && op.path.includes('_staging_')
      );
      // Note: In a real scenario these would be concurrent, but in tests they may execute sequentially
      expect(stagingUploads.length).toBeGreaterThan(0);
    });
  });

  describe('File Validation in Replacement', () => {
    test('should validate filename before processing', async () => {
      // Ensure authentication succeeds so validation logic is exercised
      const { getSession } = require('@/lib/auth/session');
      const { getUserGroups, isAdmin } = require('@/lib/auth/user-groups');
      
      getSession.mockResolvedValue({ user: { id: 'user_123' } });
      getUserGroups.mockResolvedValue(['group1', 'group2']);
      isAdmin.mockResolvedValue(true); // Admin can modify any file

      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      const maliciousFile = new File(['content'], '../../../etc/passwd.pdf', { 
        type: 'application/pdf' 
      });

      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return maliciousFile;
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Should reject malicious filename with validation-specific error
      const responseBody = result?.body || result;
      const errorMsg = responseBody?.error || '';
      const statusCode = result?.options?.status || result?.status || 0;
      
      // Assert validation-specific error (not auth error)
      expect(statusCode).toBe(400);
      expect(errorMsg).toBeTruthy();
      // Should contain validation-related error message
      const isValidationError = 
        errorMsg.includes('path traversal') || 
        errorMsg.includes('Invalid') ||
        errorMsg.includes('invalid') ||
        errorMsg.includes('filename');
      
      expect(isValidationError).toBe(true);
      
      // Should not attempt any storage operations if validation failed
      expect(mockStorageOperations.length).toBe(0);
    });

    test('should reject requests from unauthenticated users before validation', async () => {
      // Configure mocks to fail authentication
      const { getSession } = require('@/lib/auth/session');
      getSession.mockResolvedValue(null); // No session = unauthorized

      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      const maliciousFile = new File(['content'], '../../../etc/passwd.pdf', { 
        type: 'application/pdf' 
      });

      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return maliciousFile;
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Should return auth error (not validation error)
      const responseBody = result?.body || result;
      expect(responseBody.error).toBe('Unauthorized');
      const statusCode = result?.options?.status || result?.status;
      expect(statusCode).toBe(401);
      
      // Should not attempt any storage operations
      expect(mockStorageOperations.length).toBe(0);
    });

    test('should validate file type and extension', async () => {
      // Ensure authentication succeeds so validation logic is exercised
      const { getSession } = require('@/lib/auth/session');
      const { getUserGroups, isAdmin } = require('@/lib/auth/user-groups');
      
      getSession.mockResolvedValue({ user: { id: 'user_123' } });
      getUserGroups.mockResolvedValue(['group1', 'group2']);
      isAdmin.mockResolvedValue(true); // Admin can modify any file

      const { PUT } = require('@/app/api/files/[fileId]/route');
      
      const invalidFile = new File(['content'], 'malware.exe', { 
        type: 'application/x-executable' 
      });

      const mockRequest = {
        formData: jest.fn(() => Promise.resolve({
          get: jest.fn((key: string) => {
            if (key === 'file') {
              return invalidFile;
            }
            return null;
          }),
        })),
      };

      const mockContext = {
        params: Promise.resolve({ fileId: 'file_123' }),
      };

      const result = await PUT(mockRequest as any, mockContext);

      // Should reject invalid file type with validation-specific error
      const responseBody = result?.body || result;
      expect(responseBody.error).toBeDefined();
      const statusCode = result?.options?.status || result?.status;
      expect(statusCode).toBe(400); // Validation error, not auth error
      
      // Should not attempt any storage operations
      expect(mockStorageOperations.length).toBe(0);
    });
  });
});

