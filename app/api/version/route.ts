import { NextResponse } from "next/server";
import { getVersionInfo } from "@/lib/version";

/**
 * GET /api/version
 * Returns the current application version information
 */
export function GET() {
  try {
    const versionInfo = getVersionInfo();
    
    return NextResponse.json({
      ...versionInfo,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        "X-API-Version": versionInfo.version,
      },
    });
  } catch (error) {
    console.error("Error fetching version info:", error);
    return NextResponse.json(
      { error: "Failed to fetch version information" },
      { status: 500 }
    );
  }
}

