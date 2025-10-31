// Client-side WorkOS utilities
// These values are safe to expose to the browser

export const WORKOS_CLIENT_ID = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;

if (!WORKOS_CLIENT_ID) {
  throw new Error('Missing NEXT_PUBLIC_WORKOS_CLIENT_ID environment variable');
}

export const REDIRECT_URI = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || 'http://localhost:3000/auth/callback';

