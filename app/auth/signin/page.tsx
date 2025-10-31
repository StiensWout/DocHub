"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Loader2, Mail, Lock } from "lucide-react";
import { requireWorkOSClientId, REDIRECT_URI } from "@/lib/workos/client";
import { getProviderName, getProviderButtonText, getProviderDescription } from "@/lib/auth/config";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState<'sso' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      setLoadingMethod('sso');
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
      setLoadingMethod(null);
    }
  };

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setLoadingMethod('email');
      setError(null);

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      // Successfully signed in - redirect to home
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Email/password sign-in error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
      setLoadingMethod(null);
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
            Sign in with your organization account or email/password
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {!showEmailPassword ? (
            <>
              {/* SSO Sign In Button */}
              <button
                onClick={handleSSOSignIn}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg mb-4"
              >
                {loading && loadingMethod === 'sso' ? (
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

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">or</span>
                </div>
              </div>

              {/* Email/Password Sign In Button */}
              <button
                onClick={() => setShowEmailPassword(true)}
                disabled={loading}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Mail className="w-5 h-5" />
                Sign in with Email/Password
              </button>
            </>
          ) : (
            <>
              {/* Email/Password Form */}
              <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading && loadingMethod === 'email' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Back to SSO option */}
              <button
                onClick={() => {
                  setShowEmailPassword(false);
                  setEmail('');
                  setPassword('');
                  setError(null);
                }}
                disabled={loading}
                className="mt-4 w-full text-sm text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                ← Back to SSO Sign In
              </button>
            </>
          )}

          <p className="mt-6 text-center text-xs text-gray-500">
            Both SSO and email/password accounts can access the same organization.
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

