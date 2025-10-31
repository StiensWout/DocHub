# Test Suite

This directory contains automated tests for the DLWait application.

## Test Files

- `basic.test.ts` - Basic sanity checks to verify testing setup
- `xss-protection.test.tsx` - XSS vulnerability protection tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### XSS Protection Tests

The XSS protection test suite verifies that:

1. **DOMPurify Sanitization**
   - Script tags are removed from malicious payloads
   - Event handlers (onclick, onerror, etc.) are stripped
   - Safe HTML content is preserved

2. **Component Protection**
   - DocumentViewer sanitizes content before rendering
   - DocumentVersionHistory sanitizes version content
   - FileViewer uses safe DOM manipulation methods

3. **Edge Cases**
   - Null/undefined content handling
   - Empty strings
   - Mixed safe and malicious content

## Adding New Tests

1. Create a new test file in the `__tests__` directory
2. Follow the naming convention: `*.test.ts` or `*.test.tsx`
3. Import necessary testing utilities from `@testing-library/react`
4. Write descriptive test cases with clear assertions

## Test Configuration

- **Jest Config**: `jest.config.js`
- **Setup File**: `jest.setup.js`
- **Test Environment**: jsdom (for React component testing)

