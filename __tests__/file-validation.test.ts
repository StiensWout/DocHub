/**
 * File Validation Test Suite
 * Tests file type and extension validation to prevent malicious file uploads
 */

import {
  validateFileTypeAndExtension,
  validateFileSize,
  isExtensionAllowed,
  isMimeTypeAllowed,
  getFileExtension,
  getValidExtensionsForMimeType,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from "@/lib/constants/file-validation";

describe("File Validation Tests", () => {
  describe("getFileExtension", () => {
    test("should extract extension with dot", () => {
      expect(getFileExtension("document.pdf")).toBe(".pdf");
      expect(getFileExtension("file.DOCX")).toBe(".docx");
      expect(getFileExtension("image.PNG")).toBe(".png");
    });

    test("should return empty string for files without extension", () => {
      expect(getFileExtension("noextension")).toBe("");
      expect(getFileExtension("file.")).toBe("");
    });

    test("should handle multiple dots correctly", () => {
      expect(getFileExtension("file.backup.pdf")).toBe(".pdf");
      expect(getFileExtension("my.file.name.docx")).toBe(".docx");
    });

    test("should handle case insensitivity", () => {
      expect(getFileExtension("file.PDF")).toBe(".pdf");
      expect(getFileExtension("FILE.Pdf")).toBe(".pdf");
    });
  });

  describe("isExtensionAllowed", () => {
    test("should return true for allowed extensions", () => {
      expect(isExtensionAllowed(".pdf")).toBe(true);
      expect(isExtensionAllowed(".docx")).toBe(true);
      expect(isExtensionAllowed("pdf")).toBe(true);
      expect(isExtensionAllowed("docx")).toBe(true);
    });

    test("should return false for disallowed extensions", () => {
      expect(isExtensionAllowed(".exe")).toBe(false);
      expect(isExtensionAllowed(".sh")).toBe(false);
      expect(isExtensionAllowed(".bat")).toBe(false);
      expect(isExtensionAllowed(".js")).toBe(false);
      expect(isExtensionAllowed(".php")).toBe(false);
    });

    test("should be case insensitive", () => {
      expect(isExtensionAllowed(".PDF")).toBe(true);
      expect(isExtensionAllowed(".DOCX")).toBe(true);
    });
  });

  describe("isMimeTypeAllowed", () => {
    test("should return true for allowed MIME types", () => {
      expect(isMimeTypeAllowed("application/pdf")).toBe(true);
      expect(isMimeTypeAllowed("image/png")).toBe(true);
      expect(isMimeTypeAllowed("text/plain")).toBe(true);
    });

    test("should return false for disallowed MIME types", () => {
      expect(isMimeTypeAllowed("application/x-executable")).toBe(false);
      expect(isMimeTypeAllowed("application/javascript")).toBe(false);
      expect(isMimeTypeAllowed("text/html")).toBe(false);
    });
  });

  describe("getValidExtensionsForMimeType", () => {
    test("should return correct extensions for MIME type", () => {
      expect(getValidExtensionsForMimeType("application/pdf")).toEqual([".pdf"]);
      expect(getValidExtensionsForMimeType("image/jpeg")).toEqual([".jpg", ".jpeg"]);
      expect(getValidExtensionsForMimeType("text/markdown")).toEqual([".md", ".markdown"]);
    });

    test("should return empty array for invalid MIME type", () => {
      expect(getValidExtensionsForMimeType("application/x-executable")).toEqual([]);
    });
  });

  describe("validateFileSize", () => {
    test("should allow files under max size", () => {
      const result = validateFileSize(10 * 1024 * 1024); // 10MB
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("should reject files over max size", () => {
      const result = validateFileSize(60 * 1024 * 1024); // 60MB
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("exceeds maximum");
    });

    test("should allow exactly max size", () => {
      const result = validateFileSize(MAX_FILE_SIZE);
      expect(result.valid).toBe(true);
    });
  });

  describe("validateFileTypeAndExtension - Valid Cases", () => {
    test("should validate PDF files correctly", () => {
      const result = validateFileTypeAndExtension("document.pdf", "application/pdf");
      expect(result.valid).toBe(true);
    });

    test("should validate DOCX files correctly", () => {
      const result = validateFileTypeAndExtension(
        "document.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      expect(result.valid).toBe(true);
    });

    test("should validate image files correctly", () => {
      const result = validateFileTypeAndExtension("image.png", "image/png");
      expect(result.valid).toBe(true);
      
      const result2 = validateFileTypeAndExtension("photo.jpg", "image/jpeg");
      expect(result.valid).toBe(true);
    });

    test("should validate text files correctly", () => {
      const result = validateFileTypeAndExtension("readme.txt", "text/plain");
      expect(result.valid).toBe(true);
      
      const result2 = validateFileTypeAndExtension("README.md", "text/markdown");
      expect(result2.valid).toBe(true);
    });
  });

  describe("validateFileTypeAndExtension - Invalid MIME Types", () => {
    test("should reject executable files", () => {
      const result = validateFileTypeAndExtension("malware.exe", "application/x-executable");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("MIME type");
    });

    test("should reject script files", () => {
      const result = validateFileTypeAndExtension("script.js", "application/javascript");
      expect(result.valid).toBe(false);
    });

    test("should reject shell scripts", () => {
      const result = validateFileTypeAndExtension("script.sh", "application/x-sh");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateFileTypeAndExtension - Invalid Extensions", () => {
    test("should reject files without extension", () => {
      const result = validateFileTypeAndExtension("noextension", "application/pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must have a valid extension");
    });

    test("should reject disallowed extensions", () => {
      const result = validateFileTypeAndExtension("file.exe", "application/pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("extension");
    });
  });

  describe("validateFileTypeAndExtension - Mismatched Types", () => {
    test("should reject PDF extension with non-PDF MIME type", () => {
      const result = validateFileTypeAndExtension(
        "malware.pdf",
        "application/x-executable"
      );
      expect(result.valid).toBe(false);
      // Should reject invalid MIME type first
      expect(result.error).toContain("MIME type");
    });

    test("should reject DOCX extension with PDF MIME type", () => {
      const result = validateFileTypeAndExtension(
        "document.docx",
        "application/pdf"
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("does not match");
    });

    test("should reject PNG extension with JPEG MIME type", () => {
      const result = validateFileTypeAndExtension("image.png", "image/jpeg");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("does not match");
    });

    test("should reject malicious file with wrong extension", () => {
      // Example: trying to upload an executable as a PDF
      const result = validateFileTypeAndExtension(
        "malware.exe",
        "application/pdf"
      );
      expect(result.valid).toBe(false);
    });
  });

  describe("validateFileTypeAndExtension - Malicious Filenames", () => {
    test("should handle path traversal attempts in filename", () => {
      const result = validateFileTypeAndExtension(
        "../../../etc/passwd.pdf",
        "application/pdf"
      );
      // The extension check should still pass (it's .pdf)
      // But the extension should match the MIME type
      expect(result.valid).toBe(true); // Extension matches, path sanitization is separate
    });

    test("should handle double extensions", () => {
      const result = validateFileTypeAndExtension(
        "file.exe.pdf",
        "application/pdf"
      );
      expect(result.valid).toBe(true); // Last extension is .pdf
    });

    test("should handle null bytes in filename", () => {
      const result = validateFileTypeAndExtension(
        "file\0.pdf",
        "application/pdf"
      );
      // getFileExtension should handle this
      const ext = getFileExtension("file\0.pdf");
      expect(ext).toBe(".pdf");
      expect(result.valid).toBe(true);
    });

    test("should handle very long filenames", () => {
      const longName = "a".repeat(200) + ".pdf";
      const result = validateFileTypeAndExtension(longName, "application/pdf");
      expect(result.valid).toBe(true);
    });
  });

  describe("Constants", () => {
    test("should have correct max file size", () => {
      expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024); // 50MB
    });

    test("should have allowed extensions defined", () => {
      expect(ALLOWED_EXTENSIONS.length).toBeGreaterThan(0);
      expect(ALLOWED_EXTENSIONS).toContain(".pdf");
      expect(ALLOWED_EXTENSIONS).toContain(".docx");
    });

    test("should have allowed MIME types defined", () => {
      expect(ALLOWED_MIME_TYPES.length).toBeGreaterThan(0);
      expect(ALLOWED_MIME_TYPES).toContain("application/pdf");
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty filename", () => {
      const result = validateFileTypeAndExtension("", "application/pdf");
      expect(result.valid).toBe(false);
    });

    test("should handle empty MIME type", () => {
      const result = validateFileTypeAndExtension("file.pdf", "");
      expect(result.valid).toBe(false);
    });

    test("should handle case variations", () => {
      // Extension matching should be case-insensitive
      const result = validateFileTypeAndExtension("FILE.PDF", "application/pdf");
      expect(result.valid).toBe(true);
    });
  });
});

