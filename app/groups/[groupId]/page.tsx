"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApplicationGroups, getApplications } from "@/lib/supabase/queries";
import ApplicationCard from "@/components/ApplicationCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Layers, Loader2, AlertCircle, Home } from "lucide-react";
import type { ApplicationGroup, Application, BreadcrumbItem } from "@/types";
import Link from "next/link";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<ApplicationGroup | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGroupData() {
      if (!groupId) {
        setError("Group ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [groupsData, appsData] = await Promise.all([
          getApplicationGroups(),
          getApplications(),
        ]);

        const foundGroup = groupsData.find((g) => g.id === groupId);
        if (!foundGroup) {
          setError("Group not found");
          setLoading(false);
          return;
        }

        const groupApps = appsData.filter((app) => app.group_id === groupId);

        setGroup(foundGroup);
        setApplications(groupApps);
        setLoading(false);
      } catch (err) {
        console.error("Error loading group data:", err);
        setError("Failed to load group data");
        setLoading(false);
      }
    }

    loadGroupData();
  }, [groupId]);

  // Generate breadcrumbs
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: "Home",
        onClick: () => router.push("/"),
      },
    ];

    if (group) {
      items.push({
        label: group.name,
        icon: group.icon ? <group.icon className="w-4 h-4" /> : <Layers className="w-4 h-4" />,
        onClick: undefined, // Current page
      });
    }

    return items;
  };

  // Handle application click - navigate back to home with app selected via query param
  const handleAppClick = (appId: string) => {
    router.push(`/?app=${appId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
              <p className="text-gray-400">Loading group...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumbs items={[{ label: "Home", onClick: () => router.push("/") }]} />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h2 className="text-2xl font-bold mb-2">Group Not Found</h2>
              <p className="text-gray-400 mb-6">{error || "The requested group could not be found."}</p>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 border border-blue-500 rounded-lg text-sm transition-all inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={getBreadcrumbs()} />
        </div>

        {/* Group Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {(() => {
              const GroupIcon = group.icon || Layers;
              
              // Helper function to get color values
              function getColorValues(colorString: string) {
                const [colorName, shade] = (colorString || 'gray-500').split('-');
                const shadeNum = shade || '500';
                const colorMap: Record<string, Record<string, string>> = {
                  blue: { '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb' },
                  purple: { '400': '#c084fc', '500': '#a855f7', '600': '#9333ea' },
                  green: { '400': '#4ade80', '500': '#22c55e', '600': '#16a34a' },
                  red: { '400': '#f87171', '500': '#ef4444', '600': '#dc2626' },
                  orange: { '400': '#fb923c', '500': '#f97316', '600': '#ea580c' },
                  yellow: { '400': '#facc15', '500': '#eab308', '600': '#ca8a04' },
                  indigo: { '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5' },
                  pink: { '400': '#f472b6', '500': '#ec4899', '600': '#db2777' },
                  teal: { '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488' },
                  cyan: { '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2' },
                  gray: { '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563' },
                };
                const baseColor = colorMap[colorName]?.[shadeNum] || colorMap.gray['500'];
                return {
                  icon: baseColor,
                  bg: `${baseColor}20`,
                  border: `${baseColor}40`,
                };
              }
              
              const groupColors = group.color ? getColorValues(group.color) : getColorValues('gray-500');
              
              return (
                <div
                  className="p-4 rounded-lg border border-white/20"
                  style={{
                    backgroundColor: groupColors.bg,
                    borderColor: groupColors.border,
                  }}
                >
                  <GroupIcon className="w-8 h-8" style={{ color: groupColors.icon }} />
                </div>
              );
            })()}
            <div>
              <h1 className="text-4xl font-bold mb-2">{group.name}</h1>
              <p className="text-gray-400">
                {applications.length} {applications.length === 1 ? 'application' : 'applications'}
              </p>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        {applications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>This group has no applications yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onClick={() => handleAppClick(app.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

