/**
 * Templates Test Suite
 * Tests for document template utilities
 */

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  log: {
    error: jest.fn(),
  },
}));

describe('Templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemplates', () => {
    test('should fetch all templates when appId is not provided', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Template 1',
          description: 'Description 1',
          content: '<h1>Content 1</h1>',
          category: 'Category 1',
          application_id: 'app1',
        },
        {
          id: '2',
          name: 'Template 2',
          description: null,
          content: '<h1>Content 2</h1>',
          category: null,
          application_id: null,
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTemplates,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { getTemplates } = require('@/lib/templates');
      const result = await getTemplates();

      expect(mockSupabase.from).toHaveBeenCalledWith('document_templates');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockTemplates);
    });

    test('should fetch templates filtered by appId', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Template 1',
          description: 'Description 1',
          content: '<h1>Content 1</h1>',
          category: 'Category 1',
          application_id: 'app1',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockTemplates,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { getTemplates } = require('@/lib/templates');
      const result = await getTemplates('app1');

      expect(mockSupabase.from).toHaveBeenCalledWith('document_templates');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('name');
      expect(mockQuery.eq).toHaveBeenCalledWith('application_id', 'app1');
      expect(result).toEqual(mockTemplates);
    });

    test('should return empty array on error', async () => {
      const mockError = { message: 'Database error' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { getTemplates } = require('@/lib/templates');
      const { log } = require('@/lib/logger');

      const result = await getTemplates();

      expect(log.error).toHaveBeenCalledWith('Error fetching templates:', mockError);
      expect(result).toEqual([]);
    });

    test('should return empty array when data is null', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { getTemplates } = require('@/lib/templates');
      const result = await getTemplates();

      expect(result).toEqual([]);
    });

    test('should map template data correctly', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Test Template',
          description: 'Test Description',
          content: '<h1>Test</h1>',
          category: 'Test Category',
          application_id: 'app-123',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockTemplates,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { getTemplates } = require('@/lib/templates');
      const result = await getTemplates();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'template-1',
        name: 'Test Template',
        description: 'Test Description',
        content: '<h1>Test</h1>',
        category: 'Test Category',
        application_id: 'app-123',
      });
    });
  });

  describe('defaultTemplates', () => {
    test('should export default templates array', () => {
      const { defaultTemplates } = require('@/lib/templates');
      
      expect(Array.isArray(defaultTemplates)).toBe(true);
      expect(defaultTemplates.length).toBeGreaterThan(0);
    });

    test('should have all required template properties', () => {
      const { defaultTemplates } = require('@/lib/templates');
      
      defaultTemplates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('content');
        expect(typeof template.id).toBe('string');
        expect(typeof template.name).toBe('string');
        expect(typeof template.content).toBe('string');
      });
    });

    test('should include meeting notes template', () => {
      const { defaultTemplates } = require('@/lib/templates');
      
      const meetingNotes = defaultTemplates.find(t => t.id === 'meeting-notes');
      expect(meetingNotes).toBeDefined();
      expect(meetingNotes?.name).toBe('Meeting Notes');
      expect(meetingNotes?.category).toBe('General');
    });

    test('should include project plan template', () => {
      const { defaultTemplates } = require('@/lib/templates');
      
      const projectPlan = defaultTemplates.find(t => t.id === 'project-plan');
      expect(projectPlan).toBeDefined();
      expect(projectPlan?.name).toBe('Project Plan');
      expect(projectPlan?.category).toBe('Planning');
    });

    test('should include API documentation template', () => {
      const { defaultTemplates } = require('@/lib/templates');
      
      const apiDoc = defaultTemplates.find(t => t.id === 'api-documentation');
      expect(apiDoc).toBeDefined();
      expect(apiDoc?.name).toBe('API Documentation');
      expect(apiDoc?.category).toBe('Development');
    });
  });
});

