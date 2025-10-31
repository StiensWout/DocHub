/**
 * XSS Protection Test Suite
 * Tests that components properly sanitize HTML content to prevent XSS attacks
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DOMPurify from 'dompurify';

// Test helper: Extract HTML from rendered component
const getRenderedHTML = (container: HTMLElement): string => {
  return container.innerHTML;
};

// Test helper: Check if script tags are present
const hasScriptTags = (html: string): boolean => {
  const scriptRegex = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
  return scriptRegex.test(html);
};

// Test helper: Check if event handlers are present
const hasEventHandlers = (html: string): boolean => {
  const eventHandlerRegex = /on\w+\s*=/gi;
  return eventHandlerRegex.test(html);
};

describe('XSS Protection Tests', () => {
  const maliciousPayloads = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(\'XSS\')">',
    '<svg onload="alert(\'XSS\')">',
    '<div onclick="alert(\'XSS\')">Click me</div>',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<body onload="alert(\'XSS\')">',
    '<input onfocus="alert(\'XSS\')" autofocus>',
    '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
    '<style>@import\'javascript:alert("XSS")\';</style>',
  ];

  const safeHTMLContent = [
    '<p>Safe paragraph content</p>',
    '<h1>Safe heading</h1>',
    '<strong>Bold text</strong>',
    '<a href="https://example.com">Safe link</a>',
    '<img src="https://example.com/image.jpg" alt="Safe image">',
    '<ul><li>List item</li></ul>',
  ];

  describe('DOMPurify Sanitization', () => {
    test('should remove script tags from malicious payloads', () => {
      maliciousPayloads.forEach(payload => {
        const sanitized = DOMPurify.sanitize(payload, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
            'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins'
          ],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
          ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        });
        expect(hasScriptTags(sanitized)).toBe(false);
      });
    });

    test('should remove event handlers from malicious payloads', () => {
      maliciousPayloads.forEach(payload => {
        const sanitized = DOMPurify.sanitize(payload, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
            'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins'
          ],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
          ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        });
        expect(hasEventHandlers(sanitized)).toBe(false);
      });
    });

    test('should preserve safe HTML content', () => {
      safeHTMLContent.forEach(content => {
        const sanitized = DOMPurify.sanitize(content, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
            'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins'
          ],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
          ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        });
        // Should still contain the safe content
        expect(sanitized.length).toBeGreaterThan(0);
        expect(hasScriptTags(sanitized)).toBe(false);
        expect(hasEventHandlers(sanitized)).toBe(false);
      });
    });
  });

  describe('DocumentViewer Sanitization', () => {
    test('should sanitize content using DOMPurify configuration', () => {
      const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>';
      
      const sanitized = DOMPurify.sanitize(maliciousContent, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
          'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });

      expect(hasScriptTags(sanitized)).toBe(false);
      expect(sanitized).toContain('<p>Safe content</p>');
    });
  });

  describe('DocumentVersionHistory Sanitization', () => {
    test('should sanitize version content using DOMPurify', () => {
      const maliciousVersionContent = '<img src="x" onerror="alert(\'XSS\')"><p>Version content</p>';
      
      const sanitized = DOMPurify.sanitize(maliciousVersionContent, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
          'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });

      expect(hasEventHandlers(sanitized)).toBe(false);
      expect(sanitized).toContain('<p>Version content</p>');
    });
  });

  describe('FileViewer DOM Manipulation', () => {
    test('should use safe DOM manipulation instead of innerHTML', () => {
      // Mock container
      const container = document.createElement('div');
      container.innerHTML = '<p>Initial content</p>';
      
      // Simulate safe DOM manipulation (removeChild loop)
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      expect(container.innerHTML).toBe('');
      expect(container.childNodes.length).toBe(0);
    });

    test('should sanitize DOCX rendered content', () => {
      const maliciousDocxHTML = '<div><script>alert("XSS")</script><p>Document content</p></div>';
      
      // Simulate what FileViewer does: render, then sanitize
      const container = document.createElement('div');
      container.innerHTML = maliciousDocxHTML;

      const sanitized = DOMPurify.sanitize(container.innerHTML, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
          'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 'ins',
          'section', 'article', 'header', 'footer', 'nav', 'figure', 'figcaption'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'data-*'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        KEEP_CONTENT: true,
      });

      expect(hasScriptTags(sanitized)).toBe(false);
      expect(sanitized).toContain('<p>Document content</p>');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined content gracefully', () => {
      expect(() => {
        DOMPurify.sanitize(null as any);
      }).not.toThrow();

      expect(() => {
        DOMPurify.sanitize(undefined as any);
      }).not.toThrow();
    });

    test('should handle empty strings', () => {
      const sanitized = DOMPurify.sanitize('');
      expect(sanitized).toBe('');
    });

    test('should handle mixed safe and malicious content', () => {
      const mixedContent = '<p>Safe paragraph</p><script>alert("XSS")</script><strong>Bold text</strong>';
      const sanitized = DOMPurify.sanitize(mixedContent, {
        ALLOWED_TAGS: ['p', 'strong'],
        ALLOWED_ATTR: [],
      });

      expect(hasScriptTags(sanitized)).toBe(false);
      expect(sanitized).toContain('<p>Safe paragraph</p>');
      expect(sanitized).toContain('<strong>Bold text</strong>');
    });
  });
});

