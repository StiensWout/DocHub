import { cookies } from 'next/headers';
import { workos } from '@/lib/workos/server';

/**
 * Token refresh utilities
 * 
 * WorkOS tokens can expire. This module handles refreshing tokens
 * to prevent users from being logged out unexpectedly.
 */

/**
 * Refresh the access token if needed
 * Returns the access token (refreshed or existing)
 */
export async function refreshTokenIfNeeded(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('wos-session')?.value;
    const refreshToken = cookieStore.get('wos-refresh-token')?.value;

    if (!accessToken) {
      return null;
    }

    // Check if token is expired or will expire soon
    try {
      // Decode JWT to check expiration
      const tokenParts = accessToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        const exp = payload.exp;
        
        if (exp) {
          const expirationTime = exp * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeUntilExpiry = expirationTime - now;
          
          // If token expires in less than 5 minutes, refresh it
          const FIVE_MINUTES = 5 * 60 * 1000;
          
          if (timeUntilExpiry < FIVE_MINUTES && refreshToken) {
            console.log('[token-refresh] Token expiring soon, refreshing...');
            try {
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
                await workos.userManagement.refreshAccessToken(refreshToken);
              
              // Note: We can't set cookies directly in this utility function
              // The caller (getSession) needs to handle cookie setting
              // For now, we return the new token and let the caller update cookies
              console.log('[token-refresh] ✅ Token refreshed successfully');
              return newAccessToken;
            } catch (refreshError: any) {
              console.warn('[token-refresh] Failed to refresh token:', refreshError.message);
              // Return existing token - user might need to re-login
              return accessToken;
            }
          }
        }
      }
    } catch (decodeError) {
      // If we can't decode, assume token is valid and continue
      console.warn('[token-refresh] Could not decode token to check expiration');
    }

    return accessToken;
  } catch (error: any) {
    console.error('[token-refresh] Error checking token refresh:', error);
    return null;
  }
}

