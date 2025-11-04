/**
 * WorkOS Server Test Suite
 * Tests for server-side WorkOS client initialization
 */

describe('WorkOS Server', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should initialize WorkOS client when API key is set', () => {
    process.env.WORKOS_API_KEY = 'sk_test_123';
    
    // Mock WorkOS constructor
    const mockWorkOS = jest.fn();
    jest.mock('@workos-inc/node', () => ({
      WorkOS: mockWorkOS,
    }));
    
    const { workos } = require('@/lib/workos/server');
    expect(workos).toBeDefined();
  });

  test('should throw error when API key is missing', () => {
    delete process.env.WORKOS_API_KEY;
    
    expect(() => {
      require('@/lib/workos/server');
    }).toThrow('Missing WORKOS_API_KEY environment variable');
  });

  test('should throw error when API key is empty string', () => {
    process.env.WORKOS_API_KEY = '';
    
    expect(() => {
      require('@/lib/workos/server');
    }).toThrow('Missing WORKOS_API_KEY environment variable');
  });
});

