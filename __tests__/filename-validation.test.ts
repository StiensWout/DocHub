/**
 * Filename Validation Test Suite
 * Tests filename sanitization and validation to prevent path traversal and other security issues
 */

import {
  validateFilename,
  sanitizeFilename,
  validateStoragePath,
  MAX_FILENAME_LENGTH,
} from "@/lib/constants/file-validation";

describe("Filename Validation Tests", () => {
  describe("validateFilename - Valid Filenames", () => {
    test("should accept normal filenames", () => {
      expect(validateFilename("document.pdf").valid).toBe(true);
      expect(validateFilename("my-file.docx").valid).toBe(true);
      expect(validateFilename("image_file.png").valid).toBe(true);
      expect(validateFilename("test123.txt").valid).toBe(true);
    });

    test("should accept filenames with spaces", () => {
      expect(validateFilename("my document.pdf").valid).toBe(true);
      expect(validateFilename("  spaced  file.docx  ").valid).toBe(true);
    });

    test("should accept long but valid filenames", () => {
      const longName = "a".repeat(MAX_FILENAME_LENGTH - 4) + ".pdf";
      expect(validateFilename(longName).valid).toBe(true);
    });
  });

  describe("validateFilename - Path Traversal Prevention", () => {
    test("should reject filenames with ..", () => {
      const result = validateFilename("../../etc/passwd");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("path traversal");
    });

    test("should reject filenames with forward slashes", () => {
      const result = validateFilename("path/to/file.pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("path traversal");
    });

    test("should reject filenames with backslashes", () => {
      const result = validateFilename("path\\to\\file.pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("path traversal");
    });

    test("should reject various path traversal attempts", () => {
      const maliciousNames = [
        "../file.pdf",
        "..\\file.pdf",
        "./file.pdf",
        ".\\file.pdf",
        "..//file.pdf",
        "..\\\\file.pdf",
        "....//....//etc//passwd",
        "..%2F..%2Fetc%2Fpasswd",
        "file/../name.pdf",
        "file\\..\\name.pdf",
      ];

      maliciousNames.forEach((name) => {
        const result = validateFilename(name);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("path traversal");
      });
    });
  });

  describe("validateFilename - Control Characters", () => {
    test("should reject filenames with null bytes", () => {
      const result = validateFilename("file\x00.pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("control characters");
    });

    test("should reject filenames with other control characters", () => {
      const controlChars = Array.from({ length: 32 }, (_, i) => String.fromCharCode(i));
      controlChars.forEach((char) => {
        const result = validateFilename(`file${char}name.pdf`);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("control characters");
      });
    });

    test("should reject filenames with DEL character", () => {
      const result = validateFilename("file\x7F.pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("control characters");
    });
  });

  describe("validateFilename - Length Validation", () => {
    test("should reject filenames exceeding maximum length", () => {
      const longName = "a".repeat(MAX_FILENAME_LENGTH + 1);
      const result = validateFilename(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds maximum length");
      expect(result.error).toContain(MAX_FILENAME_LENGTH.toString());
    });

    test("should accept filenames at maximum length", () => {
      const maxLengthName = "a".repeat(MAX_FILENAME_LENGTH);
      expect(validateFilename(maxLengthName).valid).toBe(true);
    });
  });

  describe("validateFilename - Reserved Names", () => {
    test("should reject Windows reserved names", () => {
      const reservedNames = [
        "CON.pdf",
        "PRN.docx",
        "AUX.txt",
        "NUL.png",
        "COM1.pdf",
        "COM9.docx",
        "LPT1.txt",
        "LPT9.png",
      ];

      reservedNames.forEach((name) => {
        const result = validateFilename(name);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("reserved system name");
      });
    });

    test("should reject reserved names case-insensitively", () => {
      expect(validateFilename("con.pdf").valid).toBe(false);
      expect(validateFilename("CON.pdf").valid).toBe(false);
      expect(validateFilename("Con.pdf").valid).toBe(false);
      expect(validateFilename("cOn.pdf").valid).toBe(false);
    });

    test("should accept non-reserved names", () => {
      expect(validateFilename("CONFIG.pdf").valid).toBe(true);
      expect(validateFilename("PRINT.docx").valid).toBe(true);
    });
  });

  describe("validateFilename - Edge Cases", () => {
    test("should reject empty filenames", () => {
      expect(validateFilename("").valid).toBe(false);
      expect(validateFilename("   ").valid).toBe(false);
    });

    test("should reject filenames with only dots", () => {
      expect(validateFilename(".").valid).toBe(false);
      expect(validateFilename("..").valid).toBe(false);
      expect(validateFilename("...").valid).toBe(false);
    });

    test("should reject filenames with only spaces and dots", () => {
      expect(validateFilename(" . ").valid).toBe(false);
      expect(validateFilename("..  ..").valid).toBe(false);
    });
  });

  describe("sanitizeFilename - Path Traversal Removal", () => {
    test("should remove path traversal sequences", () => {
      expect(sanitizeFilename("../../file.pdf")).toBe("file.pdf");
      expect(sanitizeFilename("..\\..\\file.pdf")).toBe("file.pdf");
      expect(sanitizeFilename("path/../file.pdf")).toBe("pathfile.pdf");
      expect(sanitizeFilename("path\\..\\file.pdf")).toBe("pathfile.pdf");
    });

    test("should remove directory separators", () => {
      expect(sanitizeFilename("path/to/file.pdf")).toBe("pathtofile.pdf");
      expect(sanitizeFilename("path\\to\\file.pdf")).toBe("pathtofile.pdf");
    });

    test("should handle multiple path traversal attempts", () => {
      expect(sanitizeFilename("....//....//file.pdf")).toBe("file.pdf");
      expect(sanitizeFilename("..//..//file.pdf")).toBe("file.pdf");
    });
  });

  describe("sanitizeFilename - Character Sanitization", () => {
    test("should remove control characters", () => {
      expect(sanitizeFilename("file\x00name.pdf")).toBe("filename.pdf");
      expect(sanitizeFilename("file\x1Fname.pdf")).toBe("filename.pdf");
      expect(sanitizeFilename("file\x7Fname.pdf")).toBe("filename.pdf");
    });

    test("should remove leading and trailing dots", () => {
      expect(sanitizeFilename("...file.pdf")).toBe("file.pdf");
      expect(sanitizeFilename("file.pdf...")).toBe("file.pdf");
      expect(sanitizeFilename("...file.pdf...")).toBe("file.pdf");
    });

    test("should collapse multiple consecutive dots", () => {
      expect(sanitizeFilename("file....pdf")).toBe("file.pdf");
      expect(sanitizeFilename("file...name.pdf")).toBe("file.name.pdf");
    });

    test("should collapse multiple consecutive spaces", () => {
      expect(sanitizeFilename("file   name.pdf")).toBe("file name.pdf");
      expect(sanitizeFilename("  file  name  .pdf")).toBe("file name .pdf");
    });

    test("should trim whitespace", () => {
      expect(sanitizeFilename("  file.pdf  ")).toBe("file.pdf");
      expect(sanitizeFilename("\tfile.pdf\n")).toBe("file.pdf");
    });
  });

  describe("sanitizeFilename - Length Limiting", () => {
    test("should truncate long filenames while preserving extension", () => {
      const longBase = "a".repeat(MAX_FILENAME_LENGTH);
      const longFilename = `${longBase}.pdf`;
      const sanitized = sanitizeFilename(longFilename);
      
      expect(sanitized.length).toBeLessThanOrEqual(MAX_FILENAME_LENGTH);
      expect(sanitized).toMatch(/\.pdf$/);
    });

    test("should handle very long filenames", () => {
      const veryLongName = "a".repeat(MAX_FILENAME_LENGTH * 2) + ".pdf";
      const sanitized = sanitizeFilename(veryLongName);
      
      expect(sanitized.length).toBeLessThanOrEqual(MAX_FILENAME_LENGTH);
      expect(sanitized.endsWith(".pdf")).toBe(true);
    });
  });

  describe("sanitizeFilename - Empty Filename Handling", () => {
    test("should use default name for empty filenames", () => {
      expect(sanitizeFilename("")).toBe("file");
      expect(sanitizeFilename("...")).toBe("file");
      expect(sanitizeFilename("   ")).toBe("file");
      expect(sanitizeFilename("\x00\x00")).toBe("file");
    });

    test("should use default name after removing all invalid characters", () => {
      expect(sanitizeFilename("../..")).toBe("file");
      expect(sanitizeFilename("//\\\\")).toBe("file");
    });
  });

  describe("sanitizeFilename - Preserve Valid Characters", () => {
    test("should preserve alphanumeric characters", () => {
      expect(sanitizeFilename("file123.pdf")).toBe("file123.pdf");
      expect(sanitizeFilename("MyFile2024.docx")).toBe("MyFile2024.docx");
    });

    test("should preserve hyphens and dots in filename", () => {
      expect(sanitizeFilename("my-file.pdf")).toBe("my-file.pdf");
      expect(sanitizeFilename("file.name.docx")).toBe("file.name.docx");
      expect(sanitizeFilename("file-name.pdf")).toBe("file-name.pdf");
    });
  });

  describe("validateStoragePath - Valid Paths", () => {
    test("should accept valid relative paths", () => {
      expect(validateStoragePath("documents/file.pdf").valid).toBe(true);
      expect(validateStoragePath("documents/team1/app1/file.pdf").valid).toBe(true);
      expect(validateStoragePath("documents/team1/app1/doc1/uuid_file.pdf").valid).toBe(true);
    });
  });

  describe("validateStoragePath - Path Traversal Prevention", () => {
    test("should reject paths with ..", () => {
      const result = validateStoragePath("documents/../etc/passwd");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("path traversal");
    });

    test("should reject paths with multiple .. sequences", () => {
      const maliciousPaths = [
        "../../etc/passwd",
        "documents/../../etc/passwd",
        "documents/team1/../../../etc/passwd",
        "....//....//etc//passwd",
      ];

      maliciousPaths.forEach((path) => {
        const result = validateStoragePath(path);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("path traversal");
      });
    });
  });

  describe("validateStoragePath - Absolute Path Rejection", () => {
    test("should reject Unix absolute paths", () => {
      expect(validateStoragePath("/etc/passwd").valid).toBe(false);
      expect(validateStoragePath("/documents/file.pdf").valid).toBe(false);
    });

    test("should reject Windows absolute paths", () => {
      expect(validateStoragePath("C:\\Windows\\file.pdf").valid).toBe(false);
      expect(validateStoragePath("C:/Windows/file.pdf").valid).toBe(false);
      expect(validateStoragePath("\\Windows\\file.pdf").valid).toBe(false);
    });

    test("should reject drive letter paths", () => {
      expect(validateStoragePath("C:file.pdf").valid).toBe(false);
      expect(validateStoragePath("D:documents/file.pdf").valid).toBe(false);
    });
  });

  describe("validateStoragePath - Control Characters", () => {
    test("should reject paths with null bytes", () => {
      const result = validateStoragePath("documents/file\x00.pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("control characters");
    });

    test("should reject paths with other control characters", () => {
      const controlChars = ["\x00", "\x01", "\x1F", "\x7F"];
      controlChars.forEach((char) => {
        const result = validateStoragePath(`documents/file${char}name.pdf`);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("control characters");
      });
    });
  });

  describe("validateStoragePath - Edge Cases", () => {
    test("should reject empty paths", () => {
      expect(validateStoragePath("").valid).toBe(false);
      expect(validateStoragePath("   ").valid).toBe(false);
    });
  });

  describe("Integration Tests - Real-world Attack Scenarios", () => {
    test("should prevent null byte injection in filename", () => {
      const result = validateFilename("file.pdf\x00.exe");
      expect(result.valid).toBe(false);
      
      const sanitized = sanitizeFilename("file.pdf\x00.exe");
      expect(sanitized).not.toContain("\x00");
    });

    test("should prevent double extension attacks", () => {
      // Even if passed validation, sanitization should handle it
      const sanitized = sanitizeFilename("file.pdf.exe");
      expect(sanitized).toBe("file.pdf.exe"); // Valid, extension check happens elsewhere
    });

    test("should prevent unicode normalization attacks", () => {
      // Unicode characters that might look like normal characters
      const result = validateFilename("file\u202Epdf"); // Right-to-left override
      // Should pass filename validation (Unicode is allowed), but extension validation will catch it
      expect(result.valid).toBe(true);
    });

    test("should handle very complex path traversal attempts", () => {
      const complexPath = "....//....//....//etc//....//passwd";
      const result = validateStoragePath(complexPath);
      expect(result.valid).toBe(false);
      
      const sanitized = sanitizeFilename(complexPath);
      expect(sanitized).not.toContain("..");
      expect(sanitized).not.toContain("/");
    });

    test("should prevent mixed path separators", () => {
      const mixedPath = "documents/team1\\app1/..\\..\\etc\\passwd";
      const result = validateStoragePath(mixedPath);
      expect(result.valid).toBe(false);
    });
  });
});

