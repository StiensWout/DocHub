"use client";

import { getVersionDisplay, getVersionInfo } from "@/lib/version";

/**
 * Version display component
 * Shows the current application version
 */
export default function VersionDisplay({ 
  className = "", 
  showLabel = true,
  variant = "default" // "default" | "compact" | "detailed"
}: {
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "compact" | "detailed";
}) {
  const versionInfo = getVersionInfo();

  if (variant === "compact") {
    return (
      <span className={`text-xs text-gray-500 ${className}`}>
        {versionInfo.display}
      </span>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`text-xs text-gray-400 ${className}`}>
        {showLabel && <span className="font-medium">Version: </span>}
        <span>{versionInfo.display}</span>
        {versionInfo.isPreRelease && (
          <span className="ml-2 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[10px]">
            Pre-release
          </span>
        )}
        <div className="mt-1 text-[10px] text-gray-500">
          {versionInfo.appName} • {versionInfo.parsed.major}.{versionInfo.parsed.minor}.{versionInfo.parsed.patch}
        </div>
      </div>
    );
  }

  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      {showLabel && <span className="font-medium">Version: </span>}
      <span>{versionInfo.display}</span>
      {versionInfo.isPreRelease && (
        <span className="ml-2 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[10px]">
          Pre-release
        </span>
      )}
    </div>
  );
}

