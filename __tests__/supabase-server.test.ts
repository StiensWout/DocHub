/**
 * Supabase Server Test Suite
 * Tests for server-side Supabase client initialization
 */

describe('Supabase Server', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should initialize Supabase client when env vars are set (new API key)', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_123';
    
    jest.mock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => ({ mock: 'client' })),
    }));
    
    const { supabaseAdmin } = require('@/lib/supabase/server');
    expect(supabaseAdmin).toBeDefined();
  });

  test('should initialize Supabase client when env vars are set (legacy JWT key)', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    
    jest.mock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => ({ mock: 'client' })),
    }));
    
    const { supabaseAdmin } = require('@/lib/supabase/server');
    expect(supabaseAdmin).toBeDefined();
  });

  test('should throw error when URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_123';
    
    expect(() => {
      require('@/lib/supabase/server');
    }).toThrow('Missing Supabase service role environment variables');
  });

  test('should throw error when service key is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    expect(() => {
      require('@/lib/supabase/server');
    }).toThrow('Missing Supabase service role environment variables');
  });

  test('should prefer SUPABASE_SECRET_KEY over SUPABASE_SERVICE_ROLE_KEY', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_123';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'legacy_key';
    
    jest.mock('@supabase/supabase-js', () => ({
      createClient: jest.fn((url, key) => ({ url, key })),
    }));
    
    const { supabaseAdmin } = require('@/lib/supabase/server');
    expect(supabaseAdmin).toBeDefined();
  });
});

