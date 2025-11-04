"use client";

import Image from "next/image";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Building2, 
  Shield, 
  Users, 
  Calendar,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface Organization {
  id: string;
  name: string;
  role: string;
  createdAt: string;
}

interface UserProfile {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    emailVerified?: boolean;
    createdAt?: string;
  };
  role: string;
  isAdmin: boolean;
  groups: string[];
  organizations: Organization[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, authenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!authenticated) {
        router.push("/auth/signin");
        return;
      }
      fetchProfile();
    }
  }, [authenticated, authLoading, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/profile");
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
          <p className="text-gray-400 mb-4">{error || "Profile not found"}</p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const fullName = profile.user.firstName || profile.user.lastName
    ? `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim()
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-4xl font-bold mb-2">User Profile</h1>
          <p className="text-gray-400">View your account information and organization memberships</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-6">
          {/* User Info Section */}
          <div className="flex items-start gap-6 mb-8 pb-8 border-b border-white/10">
            <div className="relative">
              {profile.user.profilePictureUrl ? (
                <Image
                  src={profile.user.profilePictureUrl}
                  alt={fullName || profile.user.email}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full border-2 border-blue-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-blue-500">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              {profile.user.emailVerified && (
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {fullName || profile.user.email}
              </h2>
              {fullName && (
                <p className="text-gray-400 mb-4">{profile.user.email}</p>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                  <Shield className={`w-4 h-4 ${profile.isAdmin ? "text-yellow-400" : "text-gray-400"}`} />
                  <span className="text-sm font-medium">
                    {profile.isAdmin ? "Admin" : "User"}
                  </span>
                </div>
                {profile.user.emailVerified ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 rounded-lg">
                    <XCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400">Unverified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Mail className="w-4 h-4" />
                  User ID
                </div>
                <p className="text-sm font-mono">{profile.user.id}</p>
              </div>
              {profile.user.createdAt && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </div>
                  <p className="text-sm">{formatDate(profile.user.createdAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Organizations Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organizations ({profile.organizations.length})
            </h3>
            {profile.organizations.length > 0 ? (
              <div className="space-y-3">
                {profile.organizations.map((org) => (
                  <div
                    key={org.id}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{org.name}</h4>
                      {org.role && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                          {org.role}
                        </span>
                      )}
                    </div>
                    {org.createdAt && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {formatDate(org.createdAt)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No organization memberships</p>
            )}
          </div>

          {/* Groups Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Groups & Teams ({profile.groups.length})
            </h3>
            {profile.groups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.groups.map((group) => (
                  <span
                    key={group}
                    className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm"
                  >
                    {group}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No groups assigned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

