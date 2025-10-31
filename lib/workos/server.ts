import { WorkOS } from '@workos-inc/node';

const workosApiKey = process.env.WORKOS_API_KEY;

if (!workosApiKey) {
  throw new Error('Missing WORKOS_API_KEY environment variable');
}

// Server-side WorkOS client
// This is used for server-side operations like verifying sessions,
// creating users, managing organizations, etc.
export const workos = new WorkOS(workosApiKey);

