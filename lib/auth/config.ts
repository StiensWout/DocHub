// Authentication provider configuration
// This makes it easy to switch between different SSO providers
// Just update your WorkOS organization's connection in the Dashboard

/**
 * Get the provider name for display purposes
 * Can be overridden via environment variable, otherwise defaults to "your organization's SSO"
 */
export function getProviderName(): string {
  return process.env.NEXT_PUBLIC_SSO_PROVIDER_NAME || "your organization's SSO";
}

/**
 * Get the provider display text for sign-in button
 */
export function getProviderButtonText(): string {
  return process.env.NEXT_PUBLIC_SSO_PROVIDER_BUTTON_TEXT || "Continue with SSO";
}

/**
 * Get the provider description for sign-in page
 */
export function getProviderDescription(): string {
  return process.env.NEXT_PUBLIC_SSO_PROVIDER_DESCRIPTION || "Sign in with your organization's single sign-on";
}

