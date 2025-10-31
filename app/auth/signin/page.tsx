"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import { requireWorkOSClientId, REDIRECT_URI } from "@/lib/workos/client";
import { getProviderName, getProviderButtonText, getProviderDescription } from "@/lib/auth/config";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get provider-specific text from config
  const providerName = getProviderName();
  const buttonText = getProviderButtonText();
  const description = getProviderDescription();

  // Check for error query parameter
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'missing_code') {
      setError('Authentication failed. Please try again.');
    } else if (errorParam === 'authentication_failed') {
      setError('Authentication failed. Please try signing in again.');
    }
  }, [searchParams]);

  const handleSSOSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if client ID is available
      requireWorkOSClientId();
      
      if (!REDIRECT_URI) {
        throw new Error('Redirect URI is not configured. Please set NEXT_PUBLIC_WORKOS_REDIRECT_URI in your environment variables.');
      }
      
      // Use generic SSO endpoint - works with any provider configured in WorkOS
      const response = await fetch(`/api/auth/sso?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to initiate SSO');
      }
      
      if (!data.url) {
        throw new Error('No authorization URL returned from server');
      }
      
      console.log('Redirecting to SSO provider:', data.url);
      
      // Redirect to SSO provider (configured in WorkOS)
      window.location.href = data.url;
    } catch (err: any) {
      console.error('SSO sign-in error:', err);
      const errorMessage = err.message || 'SSO configuration error. Please check your environment variables and WorkOS Dashboard configuration.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo/Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DocHub
            </h1>
          </div>

          <h2 className="text-xl font-semibold mb-2 text-center">Sign In</h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            {description}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSSOSignIn}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
                </svg>
                {buttonText}
              </>
            )}
          </button>

          <p className="mt-6 text-center text-xs text-gray-500">
            By signing in, you agree to use {providerName} to access DocHub.
            Your account will be automatically created on first sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense to fix useSearchParams hydration issues
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

