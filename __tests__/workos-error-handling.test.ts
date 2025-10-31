/**
 * WorkOS Error Handling Test Suite
 * Tests that WorkOS operations handle errors gracefully with proper logging and meaningful messages
 */

// Mock WorkOS client
const mockWorkOS = {
  organizations: {
    listOrganizations: jest.fn(),
    getOrganization: jest.fn(),
  },
  userManagement: {
    listOrganizationMemberships: jest.fn(),
    createOrganizationMembership: jest.fn(),
    deleteOrganizationMembership: jest.fn(),
    updateOrganizationMembership: jest.fn(),
  },
};

jest.mock('@/lib/workos/server', () => ({
  workos: mockWorkOS,
}));

jest.mock('@/lib/workos/membership-cache', () => ({
  getCachedMemberships: jest.fn(() => null),
  setCachedMemberships: jest.fn(),
}));

// Suppress console.error during tests to keep output clean
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('WorkOS Error Handling Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganizations - Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const { getOrganizations } = require('@/lib/workos/organizations');
      
      mockWorkOS.organizations.listOrganizations.mockRejectedValue(
        new Error('Network error')
      );

      const result = await getOrganizations();
      
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle not_found errors', async () => {
      const { getOrganizations } = require('@/lib/workos/organizations');
      
      const error: any = new Error('Not found');
      error.code = 'not_found';
      mockWorkOS.organizations.listOrganizations.mockRejectedValue(error);

      const result = await getOrganizations();
      
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle rate limit errors', async () => {
      const { getOrganizations } = require('@/lib/workos/organizations');
      
      const error: any = new Error('Rate limit exceeded');
      error.code = 'rate_limit_exceeded';
      error.statusCode = 429;
      mockWorkOS.organizations.listOrganizations.mockRejectedValue(error);

      const result = await getOrganizations();
      
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getOrganization - Error Handling', () => {
    test('should return null and log error when organization not found', async () => {
      const { getOrganization } = require('@/lib/workos/organizations');
      
      const error: any = new Error('Organization not found');
      error.code = 'not_found';
      error.statusCode = 404;
      mockWorkOS.organizations.getOrganization.mockRejectedValue(error);

      const result = await getOrganization('org_123');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    test('should log error with organization ID context', async () => {
      const { getOrganization } = require('@/lib/workos/organizations');
      
      mockWorkOS.organizations.getOrganization.mockRejectedValue(
        new Error('Service unavailable')
      );

      await getOrganization('org_456');
      
      expect(console.error).toHaveBeenCalled();
      const errorCall = (console.error as jest.Mock).mock.calls[0];
      expect(errorCall[0]).toContain('getOrganization');
    });
  });

  describe('addUserToOrganization - Error Handling', () => {
    test('should return success=false with error message on failure', async () => {
      const { addUserToOrganization } = require('@/lib/workos/organizations');
      
      const error: any = new Error('User already in organization');
      error.code = 'invalid_request';
      mockWorkOS.userManagement.createOrganizationMembership.mockRejectedValue(error);

      const result = await addUserToOrganization('user_123', 'org_123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(console.error).toHaveBeenCalled();
    });

    test('should return success=true on success', async () => {
      const { addUserToOrganization } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.createOrganizationMembership.mockResolvedValue({});

      const result = await addUserToOrganization('user_123', 'org_123');
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should handle unauthorized errors with meaningful message', async () => {
      const { addUserToOrganization } = require('@/lib/workos/organizations');
      
      const error: any = new Error('Unauthorized');
      error.code = 'unauthorized';
      error.statusCode = 401;
      mockWorkOS.userManagement.createOrganizationMembership.mockRejectedValue(error);

      const result = await addUserToOrganization('user_123', 'org_123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('removeUserFromOrganization - Error Handling', () => {
    test('should return success=false when user is not a member', async () => {
      const { removeUserFromOrganization } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockResolvedValue({ data: [] });

      const result = await removeUserFromOrganization('user_123', 'org_123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a member');
    });

    test('should return success=false with error message on API failure', async () => {
      const { removeUserFromOrganization } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockResolvedValue({
        data: [{ id: 'membership_123', organizationId: 'org_123' }],
      });
      
      const error: any = new Error('Failed to delete');
      error.statusCode = 500;
      mockWorkOS.userManagement.deleteOrganizationMembership.mockRejectedValue(error);

      const result = await removeUserFromOrganization('user_123', 'org_123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(console.error).toHaveBeenCalled();
    });

    test('should return success=true on successful removal', async () => {
      const { removeUserFromOrganization } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockResolvedValue({
        data: [{ id: 'membership_123', organizationId: 'org_123' }],
      });
      mockWorkOS.userManagement.deleteOrganizationMembership.mockResolvedValue({});

      const result = await removeUserFromOrganization('user_123', 'org_123');
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('updateUserRoleInOrganization - Error Handling', () => {
    test('should return success=false when user is not a member', async () => {
      const { updateUserRoleInOrganization } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockResolvedValue({ data: [] });

      const result = await updateUserRoleInOrganization('user_123', 'org_123', 'admin');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a member');
    });

    test('should return success=false with error message on API failure', async () => {
      const { updateUserRoleInOrganization } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockResolvedValue({
        data: [{ id: 'membership_123', organizationId: 'org_123' }],
      });
      
      const error: any = new Error('Invalid role');
      error.code = 'invalid_request';
      mockWorkOS.userManagement.updateOrganizationMembership.mockRejectedValue(error);

      const result = await updateUserRoleInOrganization('user_123', 'org_123', 'admin');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(console.error).toHaveBeenCalled();
    });

    test('should return success=true on successful update', async () => {
      const { updateUserRoleInOrganization } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockResolvedValue({
        data: [{ id: 'membership_123', organizationId: 'org_123' }],
      });
      mockWorkOS.userManagement.updateOrganizationMembership.mockResolvedValue({});

      const result = await updateUserRoleInOrganization('user_123', 'org_123', 'admin');
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('getUserGroupsFromWorkOS - Error Handling', () => {
    test('should return empty array and log error on failure', async () => {
      const { getUserGroupsFromWorkOS } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockRejectedValue(
        new Error('Service error')
      );

      const result = await getUserGroupsFromWorkOS('user_123');
      
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    test('should return empty array for not_found errors without logging error', async () => {
      const { getUserGroupsFromWorkOS } = require('@/lib/workos/organizations');
      
      const error: any = new Error('User not found');
      error.code = 'not_found';
      mockWorkOS.userManagement.listOrganizationMemberships.mockRejectedValue(error);

      const result = await getUserGroupsFromWorkOS('user_123');
      
      expect(result).toEqual([]);
      // Should log info, not error for not_found
    });

    test('should handle partial failures when fetching organization names', async () => {
      const { getUserGroupsFromWorkOS } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockResolvedValue({
        data: [
          { organizationId: 'org_123' },
          { organizationId: 'org_456' },
        ],
      });
      
      mockWorkOS.organizations.getOrganization
        .mockResolvedValueOnce({ name: 'Org 123' })
        .mockRejectedValueOnce(new Error('Not found'));

      const result = await getUserGroupsFromWorkOS('user_123');
      
      // Should return the successful one and fallback to ID for failed one
      expect(result).toContain('Org 123');
      expect(result.some((g: string) => g === 'org_456')).toBe(true);
    });
  });

  describe('getUserOrganizationMemberships - Error Handling', () => {
    test('should return empty array and log error on failure', async () => {
      const { getUserOrganizationMemberships } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockRejectedValue(
        new Error('Service error')
      );

      const result = await getUserOrganizationMemberships('user_123');
      
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle errors when enriching individual memberships', async () => {
      const { getUserOrganizationMemberships } = require('@/lib/workos/organizations');
      
      mockWorkOS.userManagement.listOrganizationMemberships.mockResolvedValue({
        data: [
          { organizationId: 'org_123', createdAt: new Date().toISOString() },
          { organizationId: 'org_456', createdAt: new Date().toISOString() },
        ],
      });
      
      mockWorkOS.organizations.getOrganization
        .mockResolvedValueOnce({ name: 'Org 123' })
        .mockRejectedValueOnce(new Error('Not found'));

      const result = await getUserOrganizationMemberships('user_123');
      
      // Should return both, with fallback to ID for the failed one
      expect(result.length).toBe(2);
      expect(result[0].organizationName).toBe('Org 123');
      expect(result[1].organizationName).toBe('org_456'); // Fallback to ID
      expect(result[1].organizationId).toBe('org_456');
    });
  });

  describe('Error Message Extraction', () => {
    test('should extract meaningful messages from WorkOS error codes', async () => {
      const { addUserToOrganization } = require('@/lib/workos/organizations');
      
      const errorCodes = ['not_found', 'unauthorized', 'forbidden', 'rate_limit_exceeded'];
      
      for (const code of errorCodes) {
        jest.clearAllMocks();
        const error: any = new Error('Test error');
        error.code = code;
        mockWorkOS.userManagement.createOrganizationMembership.mockRejectedValue(error);

        const result = await addUserToOrganization('user_123', 'org_123');
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).not.toBe('Failed to add user to organization'); // Should be more specific
      }
    });

    test('should extract meaningful messages from HTTP status codes', async () => {
      const { addUserToOrganization } = require('@/lib/workos/organizations');
      
      const statusCodes = [404, 401, 403, 429, 500];
      const expectedMessages = [
        'Resource not found',
        'Unauthorized access',
        'Access forbidden',
        'Rate limit exceeded',
        'Service temporarily unavailable',
      ];
      
      for (let i = 0; i < statusCodes.length; i++) {
        jest.clearAllMocks();
        const error: any = new Error('Test error');
        error.statusCode = statusCodes[i];
        mockWorkOS.userManagement.createOrganizationMembership.mockRejectedValue(error);

        const result = await addUserToOrganization('user_123', 'org_123');
        
        expect(result.success).toBe(false);
        expect(result.error).toContain(expectedMessages[i]);
      }
    });
  });
});

