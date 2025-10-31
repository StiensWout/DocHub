"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import { requireWorkOSClientId, REDIRECT_URI } from "@/lib/workos/client";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for error query parameter
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'missing_code') {
      setError('Authentication failed. Please try again.');
    } else if (errorParam === 'authentication_failed') {
      setError('Authentication failed. Please try signing in again.');
    }
  }, [searchParams]);

  const handleMicrosoftSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if client ID is available
      requireWorkOSClientId();
      
      if (!REDIRECT_URI) {
        throw new Error('Redirect URI is not configured. Please set NEXT_PUBLIC_WORKOS_REDIRECT_URI in your environment variables.');
      }
      
      // Use server-side API to generate authorization URL
      // This uses WorkOS SSO getAuthorizationUrl which is correct for Microsoft
      const response = await fetch(`/api/auth/microsoft?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to initiate Microsoft SSO');
      }
      
      if (!data.url) {
        throw new Error('No authorization URL returned from server');
      }
      
      console.log('Redirecting to Microsoft SSO:', data.url);
      
      // Redirect to Microsoft SSO
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Microsoft sign-in error:', err);
      const errorMessage = err.message || 'OAuth configuration error. Please check your environment variables and WorkOS Dashboard configuration.';
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
            Sign in with your Microsoft account
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleMicrosoftSignIn}
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
                <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="10" height="10" fill="#F25022"/>
                  <rect x="12" y="0" width="10" height="10" fill="#00A4EF"/>
                  <rect x="0" y="12" width="10" height="10" fill="#7FBA00"/>
                  <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
                </svg>
                Continue with Microsoft
              </>
            )}
          </button>

          <p className="mt-6 text-center text-xs text-gray-500">
            By signing in, you agree to use your Microsoft account to access DocHub.
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

