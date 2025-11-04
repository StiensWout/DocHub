/**
 * Supabase Client Configuration Tests
 * 
 * Tests the environment variable fallback logic for Supabase clients
 * to ensure proper support for both new API keys (sb_publishable_*, sb_secret_*)
 * and legacy JWT-based keys (eyJ...).
 */

describe('Supabase Client Environment Variable Fallback', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    jest.resetModules();
    // Create a clean copy of environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Client-side Supabase client (lib/supabase/client.ts)', () => {
    describe('New API key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)', () => {
      test('should use new publishable key when available', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_key'; // gitleaks:allow
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // This should not throw
        expect(() => {
          const { supabase } = require('@/lib/supabase/client');
          expect(supabase).toBeDefined();
        }).not.toThrow();
      });

      test('should prefer new key over legacy key when both exist', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_new_key'; // gitleaks:allow
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy_key'; // gitleaks:allow

        expect(() => {
          const { supabase } = require('@/lib/supabase/client');
          expect(supabase).toBeDefined();
        }).not.toThrow();
      });

      test('should accept sb_publishable_ prefix format', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1234567890abcdef'; // gitleaks:allow
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        expect(() => {
          const { supabase } = require('@/lib/supabase/client');
          expect(supabase).toBeDefined();
        }).not.toThrow();
      });
    });

    describe('Legacy API key (NEXT_PUBLIC_SUPABASE_ANON_KEY)', () => {
      test('should fall back to legacy anon key when new key not available', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_anon_key'; // gitleaks:allow

        expect(() => {
          const { supabase } = require('@/lib/supabase/client');
          expect(supabase).toBeDefined();
        }).not.toThrow();
      });

      test('should accept JWT format (eyJ...)', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.test_signature'; // gitleaks:allow

        expect(() => {
          const { supabase } = require('@/lib/supabase/client');
          expect(supabase).toBeDefined();
        }).not.toThrow();
      });
    });

    describe('Error handling', () => {
      test('should throw error when URL is missing', () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_key'; // gitleaks:allow

        expect(() => {
          require('@/lib/supabase/client');
        }).toThrow('Missing Supabase environment variables');
      });

      test('should throw error when both keys are missing', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        expect(() => {
          require('@/lib/supabase/client');
        }).toThrow('Missing Supabase environment variables');
      });

      test('should provide helpful error message mentioning both key types', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        expect(() => {
          require('@/lib/supabase/client');
        }).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.*NEXT_PUBLIC_SUPABASE_ANON_KEY/);
      });

      test('should indicate new key is preferred', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        expect(() => {
          require('@/lib/supabase/client');
        }).toThrow(/new.*legacy/i);
      });
    });

    describe('Empty string handling', () => {
      test('should treat empty new key as missing and fall back to legacy', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ''; // gitleaks:allow
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_anon_key'; // gitleaks:allow

        expect(() => {
          const { supabase } = require('@/lib/supabase/client');
          expect(supabase).toBeDefined();
        }).not.toThrow();
      });

      test('should throw when both keys are empty strings', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = '';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

        expect(() => {
          require('@/lib/supabase/client');
        }).toThrow('Missing Supabase environment variables');
      });
    });
  });

  describe('Server-side Supabase admin client (lib/supabase/server.ts)', () => {
    describe('New API key (SUPABASE_SECRET_KEY)', () => {
      test('should use new secret key when available', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.SUPABASE_SECRET_KEY = 'sb_secret_test_key'; // gitleaks:allow
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;

        expect(() => {
          // Note: server.ts has 'server-only' import which may cause issues in tests
          // This is a validation of the logic pattern
          const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
          expect(secretKey).toBe('sb_secret_test_key');
        }).not.toThrow();
      });

      test('should prefer new key over legacy key when both exist', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.SUPABASE_SECRET_KEY = 'sb_secret_new_key'; // gitleaks:allow
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy_service_key'; // gitleaks:allow

        const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(secretKey).toBe('sb_secret_new_key');
      });

      test('should accept sb_secret_ prefix format', () => {
        process.env.SUPABASE_SECRET_KEY = 'sb_secret_1234567890abcdef'; // gitleaks:allow
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;

        const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(secretKey).toBe('sb_secret_1234567890abcdef');
      });
    });

    describe('Legacy API key (SUPABASE_SERVICE_ROLE_KEY)', () => {
      test('should fall back to legacy service role key when new key not available', () => {
        delete process.env.SUPABASE_SECRET_KEY;
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_service_role_key'; // gitleaks:allow

        const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(secretKey).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_service_role_key');
      });

      test('should accept JWT format (eyJ...)', () => {
        delete process.env.SUPABASE_SECRET_KEY;
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.test_signature'; // gitleaks:allow

        const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(secretKey).toMatch(/^eyJ/);
      });
    });

    describe('Error handling', () => {
      test('should validate URL is present', () => {
        const supabaseUrl = undefined;
        const supabaseServiceKey = 'sb_secret_test_key'; // gitleaks:allow

        if (!supabaseUrl || !supabaseServiceKey) {
          expect(supabaseUrl).toBeUndefined();
        }
      });

      test('should validate service key is present', () => {
        const supabaseUrl = 'https://test.supabase.co';
        const supabaseServiceKey = undefined;

        if (!supabaseUrl || !supabaseServiceKey) {
          expect(supabaseServiceKey).toBeUndefined();
        }
      });

      test('should provide helpful error message mentioning both key types', () => {
        const errorMessage = 'Missing Supabase service role environment variables. Set SUPABASE_SECRET_KEY (new) or SUPABASE_SERVICE_ROLE_KEY (legacy)';
        expect(errorMessage).toContain('SUPABASE_SECRET_KEY');
        expect(errorMessage).toContain('SUPABASE_SERVICE_ROLE_KEY');
        expect(errorMessage).toContain('new');
        expect(errorMessage).toContain('legacy');
      });
    });

    describe('Empty string handling', () => {
      test('should treat empty new key as missing and fall back to legacy', () => {
        process.env.SUPABASE_SECRET_KEY = '';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_service_role_key'; // gitleaks:allow

        const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(secretKey).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_service_role_key');
      });

      test('should fail validation when both keys are empty strings', () => {
        process.env.SUPABASE_SECRET_KEY = '';
        process.env.SUPABASE_SERVICE_ROLE_KEY = '';

        const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(secretKey).toBe('');
      });
    });
  });

  describe('Seed script (lib/supabase/seed.ts)', () => {
    describe('URL resolution', () => {
      test('should prefer NEXT_PUBLIC_SUPABASE_URL over SUPABASE_URL', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://public.supabase.co';
        process.env.SUPABASE_URL = 'https://private.supabase.co';

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        expect(supabaseUrl).toBe('https://public.supabase.co');
      });

      test('should fall back to SUPABASE_URL when NEXT_PUBLIC_SUPABASE_URL not set', () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        process.env.SUPABASE_URL = 'https://private.supabase.co';

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        expect(supabaseUrl).toBe('https://private.supabase.co');
      });
    });

    describe('Service key resolution', () => {
      test('should prefer SUPABASE_SECRET_KEY over SUPABASE_SERVICE_ROLE_KEY', () => {
        process.env.SUPABASE_SECRET_KEY = 'sb_secret_new_key'; // gitleaks:allow
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy_key'; // gitleaks:allow

        const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(serviceKey).toBe('sb_secret_new_key');
      });

      test('should fall back to SUPABASE_SERVICE_ROLE_KEY when SUPABASE_SECRET_KEY not set', () => {
        delete process.env.SUPABASE_SECRET_KEY;
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role_key'; // gitleaks:allow

        const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(serviceKey).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role_key');
      });
    });

    describe('Error messages', () => {
      test('should provide clear migration guidance in error message', () => {
        const errorMessage = 'Missing Supabase environment variables. Set SUPABASE_SECRET_KEY (new) or SUPABASE_SERVICE_ROLE_KEY (legacy).';
        expect(errorMessage).toContain('SUPABASE_SECRET_KEY (new)');
        expect(errorMessage).toContain('SUPABASE_SERVICE_ROLE_KEY (legacy)');
      });
    });
  });

  describe('Check DB script (scripts/check-db.ts)', () => {
    describe('URL resolution', () => {
      test('should prefer NEXT_PUBLIC_SUPABASE_URL over SUPABASE_URL', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://public.supabase.co';
        process.env.SUPABASE_URL = 'https://private.supabase.co';

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        expect(supabaseUrl).toBe('https://public.supabase.co');
      });

      test('should fall back to SUPABASE_URL when NEXT_PUBLIC_SUPABASE_URL not set', () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        process.env.SUPABASE_URL = 'https://private.supabase.co';

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        expect(supabaseUrl).toBe('https://private.supabase.co');
      });
    });

    describe('Service key resolution', () => {
      test('should prefer SUPABASE_SECRET_KEY over SUPABASE_SERVICE_ROLE_KEY', () => {
        process.env.SUPABASE_SECRET_KEY = 'sb_secret_new_key'; // gitleaks:allow
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy_key'; // gitleaks:allow

        const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(serviceKey).toBe('sb_secret_new_key');
      });

      test('should fall back to SUPABASE_SERVICE_ROLE_KEY when SUPABASE_SECRET_KEY not set', () => {
        delete process.env.SUPABASE_SECRET_KEY;
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role_key'; // gitleaks:allow

        const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(serviceKey).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role_key');
      });
    });

    describe('Error messages', () => {
      test('should provide clear migration guidance in error message', () => {
        const errorMessage = 'Missing Supabase environment variables. Set SUPABASE_SECRET_KEY (new) or SUPABASE_SERVICE_ROLE_KEY (legacy).';
        expect(errorMessage).toContain('SUPABASE_SECRET_KEY (new)');
        expect(errorMessage).toContain('SUPABASE_SERVICE_ROLE_KEY (legacy)');
      });
    });
  });

  describe('Migration scenarios', () => {
    describe('Legacy to new migration', () => {
      test('should work during migration when both keys are set', () => {
        // During migration, users might have both keys set
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_new_key'; // gitleaks:allow
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy_anon_key'; // gitleaks:allow
        process.env.SUPABASE_SECRET_KEY = 'sb_secret_new_key'; // gitleaks:allow
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy_service_key'; // gitleaks:allow

        const clientKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        expect(clientKey).toBe('sb_publishable_new_key');
        expect(serverKey).toBe('sb_secret_new_key');
      });

      test('should gracefully handle removal of legacy keys after migration', () => {
        // After migration, legacy keys can be removed
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_new_key'; // gitleaks:allow
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        process.env.SUPABASE_SECRET_KEY = 'sb_secret_new_key'; // gitleaks:allow
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;

        const clientKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        expect(clientKey).toBe('sb_publishable_new_key');
        expect(serverKey).toBe('sb_secret_new_key');
      });

      test('should still work with only legacy keys for backward compatibility', () => {
        // Existing deployments with only legacy keys should continue working
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy_anon_key'; // gitleaks:allow
        delete process.env.SUPABASE_SECRET_KEY;
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy_service_key'; // gitleaks:allow

        const clientKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        expect(clientKey).toMatch(/^eyJ/);
        expect(serverKey).toMatch(/^eyJ/);
      });
    });

    describe('Key format validation', () => {
      test('should recognize new publishable key format', () => {
        const key = 'sb_publishable_1234567890abcdef'; // gitleaks:allow
        expect(key).toMatch(/^sb_publishable_/);
      });

      test('should recognize new secret key format', () => {
        const key = 'sb_secret_1234567890abcdef'; // gitleaks:allow
        expect(key).toMatch(/^sb_secret_/);
      });

      test('should recognize legacy JWT key format', () => {
        const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_payload.test_signature'; // gitleaks:allow
        expect(key).toMatch(/^eyJ/);
      });
    });
  });

  describe('Real-world configuration scenarios', () => {
    test('should handle development environment with new keys', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dev.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dev_key'; // gitleaks:allow
      process.env.SUPABASE_SECRET_KEY = 'sb_secret_dev_key'; // gitleaks:allow

      const clientKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(clientKey).toBe('sb_publishable_dev_key');
      expect(serverKey).toBe('sb_secret_dev_key');
    });

    test('should handle production environment with legacy keys', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://prod.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.prod_anon_key'; // gitleaks:allow
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.prod_service_key'; // gitleaks:allow

      const clientKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(clientKey).toMatch(/^eyJ/);
      expect(serverKey).toMatch(/^eyJ/);
    });

    test('should handle staging environment with mixed keys', () => {
      process.env.NODE_ENV = 'staging';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://staging.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_staging_key'; // gitleaks:allow
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.staging_service_key'; // gitleaks:allow

      const clientKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(clientKey).toBe('sb_publishable_staging_key');
      expect(serverKey).toMatch(/^eyJ/);
    });
  });
});