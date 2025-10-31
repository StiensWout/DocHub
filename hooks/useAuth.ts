"use client";

import { useState, useEffect } from "react";
import type { SessionUser } from "@/lib/auth/session";

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  authenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
  });

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();

      if (data.authenticated && data.user) {
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        });
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
      });
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
      // Redirect to sign in page
      window.location.href = "/auth/signin";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    ...authState,
    signOut,
    refetch: checkSession,
  };
}

