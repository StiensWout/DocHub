// Client-side WorkOS utilities
// These values are safe to expose to the browser

export const WORKOS_CLIENT_ID = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || '';

// Only throw error if trying to use OAuth (which requires client ID)
// Don't throw on module load to avoid breaking navigation
export function requireWorkOSClientId(): string {
  if (!WORKOS_CLIENT_ID) {
    throw new Error('Missing NEXT_PUBLIC_WORKOS_CLIENT_ID environment variable');
  }
  return WORKOS_CLIENT_ID;
}

export const REDIRECT_URI = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || 'http://localhost:3000/auth/callback';

