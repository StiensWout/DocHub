"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // SSO doesn't require a separate sign-up page
    // Redirect to sign-in where users can authenticate with Microsoft
    router.replace("/auth/signin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DocHub
            </h1>
          </div>

          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
