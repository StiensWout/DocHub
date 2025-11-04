/**
 * Version management utilities
 * Reads version from package.json and provides version information
 */

import packageJson from '../package.json';

export const VERSION = packageJson.version;
export const APP_NAME = packageJson.name;

/**
 * Get the full version string
 */
export function getVersion(): string {
  return VERSION;
}

/**
 * Get the application name
 */
export function getAppName(): string {
  return APP_NAME;
}

/**
 * Parse version into components
 */
export function parseVersion(version: string = VERSION): {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
} {
  const parts = version.split('-');
  const versionPart = parts[0];
  const preRelease = parts[1];

  const [major, minor, patch] = versionPart.split('.').map(Number);

  return {
    major,
    minor,
    patch,
    ...(preRelease && { preRelease }),
  };
}

/**
 * Check if version is a pre-release
 */
export function isPreRelease(version: string = VERSION): boolean {
  return version.includes('-');
}

/**
 * Get version display string
 */
export function getVersionDisplay(version: string = VERSION): string {
  if (isPreRelease(version)) {
    return `v${version} (Pre-release)`;
  }
  return `v${version}`;
}

/**
 * Get version info object
 */
export function getVersionInfo() {
  return {
    version: VERSION,
    appName: APP_NAME,
    display: getVersionDisplay(),
    parsed: parseVersion(),
    isPreRelease: isPreRelease(),
  };
}

