/**
 * File Validation Constants and Utilities
 * 
 * Defines allowed file types, extensions, and validation functions
 * for file upload and viewing operations.
 */

/**
 * Mapping of allowed MIME types to their valid file extensions
 */
export const ALLOWED_FILE_TYPES = {
  // PDF Documents
  "application/pdf": [".pdf"],
  
  // Microsoft Word Documents
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  
  // Microsoft Excel Spreadsheets
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  
  // Microsoft PowerPoint Presentations
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  
  // Text Files
  "text/plain": [".txt"],
  "text/markdown": [".md", ".markdown"],
  
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
} as const;

/**
 * Array of all allowed MIME types
 */
export const ALLOWED_MIME_TYPES = Object.keys(ALLOWED_FILE_TYPES) as Array<keyof typeof ALLOWED_FILE_TYPES>;

/**
 * Array of all allowed file extensions (normalized to lowercase)
 */
export const ALLOWED_EXTENSIONS = Array.from(
  new Set(
    Object.values(ALLOWED_FILE_TYPES)
      .flat()
      .map(ext => ext.toLowerCase())
  )
);

/**
 * Maximum file size: 50MB
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Maximum filename length: 255 characters (common filesystem limit)
 */
export const MAX_FILENAME_LENGTH = 255;

/**
 * Extract file extension from filename
 * @param filename - The filename to extract extension from
 * @returns The file extension with leading dot (e.g., ".pdf"), or empty string if none found
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return "";
  }
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Get valid extensions for a given MIME type
 * @param mimeType - The MIME type to get extensions for
 * @returns Array of valid extensions for the MIME type, or empty array if MIME type not allowed
 */
export function getValidExtensionsForMimeType(mimeType: string): string[] {
  return ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES] || [];
}

/**
 * Check if a file extension is allowed
 * @param extension - The file extension (with or without leading dot)
 * @returns True if extension is allowed, false otherwise
 */
export function isExtensionAllowed(extension: string): boolean {
  const normalizedExt = extension.startsWith(".") 
    ? extension.toLowerCase() 
    : `.${extension.toLowerCase()}`;
  return ALLOWED_EXTENSIONS.includes(normalizedExt);
}

/**
 * Check if a MIME type is allowed
 * @param mimeType - The MIME type to check
 * @returns True if MIME type is allowed, false otherwise
 */
export function isMimeTypeAllowed(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as keyof typeof ALLOWED_FILE_TYPES);
}

/**
 * Validate that a file's extension matches its MIME type
 * @param filename - The filename to extract extension from
 * @param mimeType - The MIME type of the file
 * @returns Object with validation result and error message if invalid
 */
export function validateFileTypeAndExtension(
  filename: string,
  mimeType: string
): { valid: boolean; error?: string } {
  // Check if MIME type is allowed
  if (!isMimeTypeAllowed(mimeType)) {
    return {
      valid: false,
      error: `MIME type "${mimeType}" is not allowed`,
    };
  }

  // Extract and check extension
  const extension = getFileExtension(filename);
  if (!extension) {
    return {
      valid: false,
      error: "File must have a valid extension",
    };
  }

  // Check if extension is in the allowed list
  if (!isExtensionAllowed(extension)) {
    return {
      valid: false,
      error: `File extension "${extension}" is not allowed`,
    };
  }

  // Verify extension matches MIME type
  const validExtensions = getValidExtensionsForMimeType(mimeType);
  if (!validExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension "${extension}" does not match MIME type "${mimeType}". Expected one of: ${validExtensions.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 * @param size - File size in bytes
 * @returns Object with validation result and error message if invalid
 */
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
    };
  }
  return { valid: true };
}

/**
 * Sanitize filename to prevent path traversal and other security issues
 * @param filename - The original filename
 * @returns Sanitized filename safe for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components (prevents path traversal)
  let sanitized = filename
    .replace(/[/\\]/g, "") // Remove / and \ (directory separators)
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim();

  // First, collapse multiple consecutive dots (3+) to single dots
  // This handles cases like "file....pdf" -> "file.pdf"
  sanitized = sanitized.replace(/\.{3,}/g, ".");

  // Then remove remaining path traversal sequences (..)
  // This handles cases like "file../name.pdf" -> "file/name.pdf" -> "filename.pdf" (slashes already removed)
  sanitized = sanitized.replace(/\.\./g, "");

  // Collapse any remaining multiple consecutive dots to single dot (safety check)
  sanitized = sanitized.replace(/\.{2,}/g, ".");

  // Remove leading and trailing dots (after collapsing)
  sanitized = sanitized.replace(/^\.+/, "").replace(/\.+$/, "");

  // If filename is empty after sanitization, use a default
  if (!sanitized) {
    sanitized = "file";
  }

  // Collapse multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, " ");

  // Limit length (preserve extension)
  const extension = getFileExtension(sanitized);
  const baseName = sanitized.slice(0, sanitized.length - extension.length);
  const maxBaseLength = MAX_FILENAME_LENGTH - extension.length;
  
  if (baseName.length > maxBaseLength) {
    sanitized = baseName.slice(0, maxBaseLength) + extension;
  }

  return sanitized;
}

/**
 * Validate filename for security issues
 * @param filename - The filename to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateFilename(filename: string): { valid: boolean; error?: string } {
  if (!filename || filename.trim().length === 0) {
    return {
      valid: false,
      error: "Filename cannot be empty",
    };
  }

  // Check for path traversal attempts
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return {
      valid: false,
      error: "Filename contains invalid characters (path traversal attempt detected)",
    };
  }

  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(filename)) {
    return {
      valid: false,
      error: "Filename contains invalid control characters",
    };
  }

  // Check length
  if (filename.length > MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: `Filename exceeds maximum length of ${MAX_FILENAME_LENGTH} characters`,
    };
  }

  // Check for reserved names (Windows reserved names)
  const reservedNames = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
  const baseName = filename.split(".")[0].toUpperCase();
  if (reservedNames.includes(baseName)) {
    return {
      valid: false,
      error: `Filename uses a reserved system name: ${baseName}`,
    };
  }

  // Check for only dots or spaces
  if (/^[\s.]+$/.test(filename)) {
    return {
      valid: false,
      error: "Filename cannot consist only of dots or spaces",
    };
  }

  return { valid: true };
}

/**
 * Validate storage path to ensure it doesn't contain path traversal
 * @param path - The storage path to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateStoragePath(path: string): { valid: boolean; error?: string } {
  if (!path || path.trim().length === 0) {
    return {
      valid: false,
      error: "Storage path cannot be empty",
    };
  }

  // Check for path traversal attempts
  if (path.includes("..")) {
    return {
      valid: false,
      error: "Storage path contains path traversal attempt (..)",
    };
  }

  // Check for absolute paths
  if (path.startsWith("/") || path.startsWith("\\") || /^[a-zA-Z]:/.test(path)) {
    return {
      valid: false,
      error: "Storage path must be relative, not absolute",
    };
  }

  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(path)) {
    return {
      valid: false,
      error: "Storage path contains invalid control characters",
    };
  }

  return { valid: true };
}

