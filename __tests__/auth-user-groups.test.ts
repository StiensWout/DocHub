/**
 * Auth User Groups Test Suite
 * Tests for user groups and admin role management
 */

// Mock Next.js cookies
const mockCookieStore = {
  get: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock session
const mockSession = {
  user: { id: 'user-123', email: 'test@example.com' },
  accessToken: 'token-123',
};

jest.mock('@/lib/auth/session', () => ({
  getSession: jest.fn(() => Promise.resolve(mockSession)),
}));

// Mock Supabase
const mockSupabaseAdmin = {
  from: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

// Mock WorkOS organizations
const mockGetUserGroupsFromWorkOS = jest.fn();
const mockGetUserOrganizationMemberships = jest.fn();
jest.mock('@/lib/workos/organizations', () => ({
  getUserGroupsFromWorkOS: mockGetUserGroupsFromWorkOS,
  getUserOrganizationMemberships: mockGetUserOrganizationMemberships,
}));

// Mock team sync
const mockSyncTeamsFromUserOrganizations = jest.fn();
const mockIsUserInAdminOrganization = jest.fn();
jest.mock('@/lib/workos/team-sync', () => ({
  syncTeamsFromUserOrganizations: mockSyncTeamsFromUserOrganizations,
  isUserInAdminOrganization: mockIsUserInAdminOrganization,
}));

// Mock user sync
const mockGetAllLocalUsers = jest.fn();
jest.mock('@/lib/workos/user-sync', () => ({
  getAllLocalUsers: mockGetAllLocalUsers,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  log: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Auth User Groups', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    
    // Reset mock implementations
    mockGetUserGroupsFromWorkOS.mockResolvedValue([]);
    mockGetUserOrganizationMemberships.mockResolvedValue([]);
    mockSyncTeamsFromUserOrganizations.mockResolvedValue([]);
    mockIsUserInAdminOrganization.mockResolvedValue(false);
    mockGetAllLocalUsers.mockResolvedValue([]);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getUserGroups', () => {
    test('should return groups from database when WORKOS_USE_ORGANIZATIONS is not set', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { group_name: 'Group1' },
            { group_name: 'Group2' },
          ],
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { getUserGroups } = require('@/lib/auth/user-groups');
      const result = await getUserGroups('user-123');
      
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('user_groups');
      expect(result).toEqual(['Group1', 'Group2']);
    });

    test('should return empty array when no groups found in database', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { getUserGroups } = require('@/lib/auth/user-groups');
      const result = await getUserGroups('user-123');
      
      expect(result).toEqual([]);
    });

    test('should return empty array on database error', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { getUserGroups } = require('@/lib/auth/user-groups');
      const result = await getUserGroups('user-123');
      
      expect(result).toEqual([]);
    });

    test('should use WorkOS groups when WORKOS_USE_ORGANIZATIONS is true', async () => {
      process.env.WORKOS_USE_ORGANIZATIONS = 'true';
      
      const mockMemberships = [
        {
          organizationId: 'org-1',
          organizationName: 'Org1',
          role: 'admin',
        },
      ];
      
      mockGetUserOrganizationMemberships.mockResolvedValue(mockMemberships);
      mockSyncTeamsFromUserOrganizations.mockResolvedValue(['team-1']);
      mockGetUserGroupsFromWorkOS.mockResolvedValue(['Org1']);
      mockIsUserInAdminOrganization.mockResolvedValue(false);
      
      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: 'admin' },
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockTeamQuery);
      
      const { getUserGroups } = require('@/lib/auth/user-groups');
      const result = await getUserGroups('user-123');
      
      expect(mockGetUserOrganizationMemberships).toHaveBeenCalled();
      expect(mockSyncTeamsFromUserOrganizations).toHaveBeenCalled();
      expect(mockGetUserGroupsFromWorkOS).toHaveBeenCalled();
    });

    test('should return all teams for admin users', async () => {
      process.env.WORKOS_USE_ORGANIZATIONS = 'true';
      
      const mockMemberships = [
        {
          organizationId: 'org-1',
          organizationName: 'AdminOrg',
          role: 'admin',
        },
      ];
      
      mockGetUserOrganizationMemberships.mockResolvedValue(mockMemberships);
      mockSyncTeamsFromUserOrganizations.mockResolvedValue(['team-1']);
      mockGetUserGroupsFromWorkOS.mockResolvedValue(['AdminOrg']);
      mockIsUserInAdminOrganization.mockResolvedValue(true);
      
      const mockTeamsQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            { name: 'Team1' },
            { name: 'Team2' },
          ],
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockTeamsQuery);
      
      const { getUserGroups } = require('@/lib/auth/user-groups');
      const result = await getUserGroups('user-123');
      
      expect(result).toContain('Admin');
      expect(result).toContain('Team1');
      expect(result).toContain('Team2');
    });

    test('should handle WorkOS error and fallback to database', async () => {
      process.env.WORKOS_USE_ORGANIZATIONS = 'true';
      
      mockGetUserOrganizationMemberships.mockRejectedValue(new Error('WorkOS error'));
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ group_name: 'FallbackGroup' }],
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { getUserGroups } = require('@/lib/auth/user-groups');
      const result = await getUserGroups('user-123');
      
      expect(result).toEqual(['FallbackGroup']);
    });
  });

  describe('isAdmin', () => {
    test('should return false when no session', async () => {
      const { getSession } = require('@/lib/auth/session');
      getSession.mockResolvedValueOnce(null);
      
      const { isAdmin } = require('@/lib/auth/user-groups');
      const result = await isAdmin();
      
      expect(result).toBe(false);
    });

    test('should return true when user is admin in database', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { isAdmin } = require('@/lib/auth/user-groups');
      const result = await isAdmin();
      
      expect(result).toBe(true);
    });

    test('should return false when user is not admin in database', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { isAdmin } = require('@/lib/auth/user-groups');
      const result = await isAdmin();
      
      expect(result).toBe(false);
    });

    test('should return false when user has no role', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { isAdmin } = require('@/lib/auth/user-groups');
      const result = await isAdmin();
      
      expect(result).toBe(false);
    });

    test('should check WorkOS admin organization when enabled', async () => {
      process.env.WORKOS_USE_ORGANIZATIONS = 'true';
      mockIsUserInAdminOrganization.mockResolvedValue(true);
      
      const { isAdmin } = require('@/lib/auth/user-groups');
      const result = await isAdmin();
      
      expect(mockIsUserInAdminOrganization).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should fallback to database when WorkOS check fails', async () => {
      process.env.WORKOS_USE_ORGANIZATIONS = 'true';
      mockIsUserInAdminOrganization.mockRejectedValue(new Error('WorkOS error'));
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { isAdmin } = require('@/lib/auth/user-groups');
      const result = await isAdmin();
      
      expect(result).toBe(true);
    });

    test('should check specific userId when provided', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { isAdmin } = require('@/lib/auth/user-groups');
      const result = await isAdmin('specific-user-id');
      
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'specific-user-id');
      expect(result).toBe(true);
    });
  });

  describe('getUserRole', () => {
    test('should return user when no session', async () => {
      const { getSession } = require('@/lib/auth/session');
      getSession.mockResolvedValueOnce(null);
      
      const { getUserRole } = require('@/lib/auth/user-groups');
      const result = await getUserRole();
      
      expect(result).toBe('user');
    });

    test('should return admin when user is admin in database', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { getUserRole } = require('@/lib/auth/user-groups');
      const result = await getUserRole();
      
      expect(result).toBe('admin');
    });

    test('should return user when user is not admin', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { getUserRole } = require('@/lib/auth/user-groups');
      const result = await getUserRole();
      
      expect(result).toBe('user');
    });

    test('should check WorkOS admin organization when enabled', async () => {
      process.env.WORKOS_USE_ORGANIZATIONS = 'true';
      mockIsUserInAdminOrganization.mockResolvedValue(true);
      
      const { getUserRole } = require('@/lib/auth/user-groups');
      const result = await getUserRole();
      
      expect(result).toBe('admin');
    });

    test('should return user when user has no role', async () => {
      delete process.env.WORKOS_USE_ORGANIZATIONS;
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockQuery);
      
      const { getUserRole } = require('@/lib/auth/user-groups');
      const result = await getUserRole();
      
      expect(result).toBe('user');
    });
  });

  describe('getAllUsers', () => {
    test('should return empty array when user is not admin', async () => {
      // Mock isAdmin to return false for this test
      const mockIsAdminQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockIsAdminQuery);
      
      const { getAllUsers } = require('@/lib/auth/user-groups');
      const result = await getAllUsers();
      
      // getAllUsers catches the error and returns empty array
      expect(result).toEqual([]);
    });

    test('should return all users with roles and groups', async () => {
      // Mock isAdmin to return true - user is admin
      const mockIsAdminQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
      
      mockGetAllLocalUsers.mockResolvedValue([
        { workos_user_id: 'user-1', email: 'user1@example.com' },
        { workos_user_id: 'user-2', email: 'user2@example.com' },
      ]);
      
      const mockRolesQuery = {
        select: jest.fn().mockResolvedValue({
          data: [
            { user_id: 'user-1', role: 'admin' },
            { user_id: 'user-2', role: 'user' },
          ],
          error: null,
        }),
      };
      
      const mockGroupsQuery = {
        select: jest.fn().mockResolvedValue({
          data: [
            { user_id: 'user-1', group_name: 'Group1' },
            { user_id: 'user-1', group_name: 'Group2' },
          ],
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'user_roles') {
          // First call for isAdmin check, then for getAllUsers
          if (mockIsAdminQuery.single.mock.calls.length === 0) {
            return mockIsAdminQuery;
          }
          return mockRolesQuery;
        }
        if (table === 'user_groups') return mockGroupsQuery;
        return {};
      });
      
      const { getAllUsers } = require('@/lib/auth/user-groups');
      const result = await getAllUsers();
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        userId: 'user-1',
        email: 'user1@example.com',
        role: 'admin',
        groups: ['Group1', 'Group2'],
      });
      expect(result[1]).toEqual({
        userId: 'user-2',
        email: 'user2@example.com',
        role: 'user',
        groups: [],
      });
    });

    test('should handle missing roles and groups gracefully', async () => {
      // Mock isAdmin to return true
      const mockIsAdminQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
      
      mockGetAllLocalUsers.mockResolvedValue([
        { workos_user_id: 'user-1', email: 'user1@example.com' },
      ]);
      
      const mockRolesQuery = {
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        }),
      };
      
      const mockGroupsQuery = {
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        }),
      };
      
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'user_roles') {
          // First call for isAdmin check
          if (mockIsAdminQuery.single.mock.calls.length === 0) {
            return mockIsAdminQuery;
          }
          return mockRolesQuery;
        }
        if (table === 'user_groups') return mockGroupsQuery;
        return {};
      });
      
      const { getAllUsers } = require('@/lib/auth/user-groups');
      const result = await getAllUsers();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userId: 'user-1',
        email: 'user1@example.com',
        role: 'user', // Default role
        groups: [], // Empty groups
      });
    });

    test('should return empty array on error', async () => {
      // Mock isAdmin to return true
      const mockIsAdminQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
      
      mockSupabaseAdmin.from.mockReturnValue(mockIsAdminQuery);
      mockGetAllLocalUsers.mockRejectedValue(new Error('Error'));
      
      const { getAllUsers } = require('@/lib/auth/user-groups');
      const result = await getAllUsers();
      
      expect(result).toEqual([]);
    });
  });
});

