/**
 * JWT Utilities
 * 
 * Proper JWT token decoding using Base64url encoding (RFC 7515)
 * JWTs use Base64url, not standard Base64
 */

/**
 * Decode Base64url string to JSON
 * Base64url uses '-' and '_' instead of '+' and '/', and omits padding
 */
export function decodeBase64url(base64url: string): string {
  // Replace Base64url characters with Base64 characters
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // Decode from Base64
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Decode JWT payload without verification
 * Returns the decoded payload object
 */
export function decodeJWTPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format: expected 3 parts');
    }
    
    const payloadPart = parts[1];
    const decoded = decodeBase64url(payloadPart);
    return JSON.parse(decoded);
  } catch (error: any) {
    throw new Error(`Failed to decode JWT: ${error.message}`);
  }
}

