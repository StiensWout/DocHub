# Document Viewer Enhancements

## Overview

This feature request outlines enhancements to the document viewer to improve document accessibility, sharing capabilities, and export functionality. These enhancements will make documents more versatile and easier to share with team members and external stakeholders.

## Goals

- Enable users to print documents with proper formatting
- Allow document export in multiple formats (PDF, Markdown)
- Provide easy document sharing via shareable links
- Improve document accessibility and portability
- Maintain document formatting and styling during export

## User Stories

### As a user, I want to...

1. **Print documents** so I can have a physical copy or share printed documentation
2. **Export documents to PDF** so I can share them with external stakeholders or archive them
3. **Export documents to Markdown** so I can use them in other tools or version control systems
4. **Share documents via a link** so I can quickly share specific documents with team members
5. **Control print formatting** so documents look professional when printed
6. **Preserve document styling** when exporting to ensure the exported version matches the original
7. **Copy document links** so I can easily share them in emails, chat, or other communication tools

## Current State

### Existing Document Viewer Features
- ✅ Document viewing with HTML rendering
- ✅ Document metadata display (title, category, app name, updated date)
- ✅ Edit and delete actions
- ✅ Version history viewing
- ✅ File attachments display
- ✅ Breadcrumb navigation
- ✅ Responsive design

### Limitations
- ✅ Print functionality - **COMPLETED**
- ✅ Export capabilities (PDF, Markdown) - **COMPLETED**
- ✅ Shareable link generation - **COMPLETED**
- ✅ Print-specific styling - **COMPLETED**
- ✅ Documents can be easily shared externally - **COMPLETED**

## Proposed Features

### 1. Print-Friendly View

A print-optimized view that removes UI elements and formats content for printing.

#### Features
- **Print Button**: Action button in document viewer header
- **Print Styling**: CSS media queries for print optimization
- **Hide UI Elements**: Remove navigation, buttons, and other non-content elements when printing
- **Page Breaks**: Proper page break handling for long documents
- **Header/Footer**: Optional document title and page numbers in print output
- **Color Optimization**: Option to print in grayscale or color

#### Technical Requirements
- Component: Add print button to `components/DocumentViewer.tsx`
- CSS: `@media print` styles in `app/globals.css`
- Print handler: `window.print()` or custom print dialog
- Formatting: Remove background colors, optimize text contrast
- Page breaks: Use CSS `page-break-before` and `page-break-after`

#### Implementation Details
```typescript
// Print handler
const handlePrint = () => {
  window.print();
};

// Print styles
@media print {
  .no-print { display: none; }
  body { background: white; }
  .document-content { 
    color: black;
    page-break-inside: avoid;
  }
}
```

### 2. Export to PDF

Generate PDF files from document content with proper formatting.

#### Features
- **PDF Export Button**: Action button in document viewer header
- **Format Preservation**: Maintain document styling, formatting, and images
- **Metadata**: Include document title, author, and creation date in PDF
- **File Naming**: Auto-generate filename based on document title
- **Download**: Automatically download PDF file after generation
- **Loading State**: Show progress indicator during PDF generation

#### Technical Requirements
- Library: `jsPDF` or `html2pdf.js` or `puppeteer` (server-side)
- Component: Export button in `components/DocumentViewer.tsx`
- Function: `exportToPDF()` handler
- Styling: Convert HTML/CSS to PDF-compatible format
- Images: Embed images in PDF or convert to base64

#### Implementation Options

**Option A: Client-side (jsPDF/html2pdf.js)**
- Pros: No server required, fast, works offline
- Cons: Limited formatting control, may not handle complex layouts

**Option B: Server-side (Puppeteer/Headless Chrome)**
- Pros: Better formatting, handles complex layouts, professional output
- Cons: Requires API endpoint, server resources

**Recommended**: Start with client-side (html2pdf.js) for MVP, upgrade to server-side if needed.

#### Implementation Details
```typescript
import html2pdf from 'html2pdf.js';

const exportToPDF = async () => {
  const element = document.getElementById('document-content');
  const opt = {
    margin: 1,
    filename: `${document.title}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  
  await html2pdf().set(opt).from(element).save();
};
```

### 3. Export to Markdown

Convert document content to Markdown format for use in other tools.

#### Features
- **Markdown Export Button**: Action button in document viewer header
- **Format Conversion**: Convert HTML to Markdown
- **Markdown Syntax**: Proper Markdown formatting (headers, lists, links, images)
- **File Download**: Download as `.md` file
- **Preserve Structure**: Maintain document hierarchy and formatting

#### Technical Requirements
- Library: `turndown` or `html-to-md` for HTML to Markdown conversion
- Component: Export button in `components/DocumentViewer.tsx`
- Function: `exportToMarkdown()` handler
- Conversion: Parse HTML content and convert to Markdown syntax
- File Download: Generate blob and trigger download

#### Implementation Details
```typescript
import TurndownService from 'turndown';

const exportToMarkdown = () => {
  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(document.content);
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${document.title}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
```

### 4. Share Document Link

Generate shareable links for documents that can be used to access documents directly.

#### Features
- **Share Button**: Action button in document viewer header
- **Link Generation**: Create unique, shareable URL for document
- **Copy to Clipboard**: One-click copy of shareable link
- **Link Dialog**: Modal showing shareable link with copy button
- **Link Format**: Clean, readable URL format (e.g., `/share/document/{id}` or `/doc/{id}`)
- **Access Control**: Respect team/document permissions (only share if user has access)
- **QR Code**: Optional QR code generation for easy mobile sharing

#### Technical Requirements
- Component: Share button and dialog in `components/DocumentViewer.tsx`
- State: Track shareable link state
- Clipboard API: Use `navigator.clipboard.writeText()` for copy functionality
- URL Format: `/documents/{teamId}/{appId}/{documentId}` or `/share/{documentId}`
- Permissions: Verify user has access before generating link
- Optional: QR code library (`qrcode.js` or `react-qr-code`)

#### Implementation Details
```typescript
const handleShare = () => {
  const shareUrl = `${window.location.origin}/documents/${teamId}/${appId}/${document.id}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    toast.success('Link copied to clipboard!');
  });
};

// QR Code (optional)
import QRCode from 'qrcode';
const generateQRCode = async (url: string) => {
  const qrDataUrl = await QRCode.toDataURL(url);
  return qrDataUrl;
};
```

## UI/UX Design

### Document Viewer Header Actions

Current actions:
```
[Clock] [Edit] [Delete] [X]
```

Enhanced actions:
```
[Clock] [Edit] [Share] [Export] [Print] [Delete] [X]
```

### Export Menu (Dropdown)

Instead of separate buttons, consider a dropdown menu:
```
[Export ▼]
  ├─ Export to PDF
  ├─ Export to Markdown
  └─ Export to HTML
```

### Share Dialog

```
┌─────────────────────────────────────┐
│  Share Document                     │
├─────────────────────────────────────┤
│  Anyone with this link can view:    │
│                                     │
│  https://dochub.app/doc/abc123     │
│  [Copy Link]                        │
│                                     │
│  [QR Code Preview]                  │
│                                     │
│  [Close]                            │
└─────────────────────────────────────┘
```

## Technical Considerations

### Dependencies

**For PDF Export:**
- `html2pdf.js` (client-side) OR
- `puppeteer` (server-side with API endpoint)

**For Markdown Export:**
- `turndown` - HTML to Markdown converter

**For QR Code (optional):**
- `qrcode` or `react-qr-code`

**For Share Link:**
- No additional dependencies (uses clipboard API)

### Performance

- **PDF Generation**: May take 1-3 seconds for large documents
- **Markdown Conversion**: Fast (< 100ms)
- **Share Link**: Instant (no processing needed)

### Security Considerations

- **Share Links**: Ensure links respect RLS policies and team permissions
- **PDF Export**: Sanitize content before PDF generation
- **Markdown Export**: Sanitize HTML before conversion

### Browser Compatibility

- **Print**: Universal support (`window.print()`)
- **PDF Export**: Requires modern browser (ES6+)
- **Markdown Export**: Universal support
- **Clipboard API**: Modern browsers (Chrome 66+, Firefox 63+, Safari 13.1+)

## Implementation Phases

### Phase 1: Print-Friendly View (MVP) ✅ COMPLETED
- [x] Add print button to document viewer
- [x] Implement print CSS styles
- [x] Test print output formatting
- [x] Add print preview option (via browser print dialog)
- [x] Comprehensive print styles for all prose elements
- [x] Print header with document metadata
- [x] Page break optimization

### Phase 2: Export to Markdown ✅ COMPLETED
- [x] Install `turndown` library
- [x] Add export button
- [x] Implement Markdown conversion
- [x] Test with various document formats
- [x] Handle edge cases (tables, images, links)

### Phase 3: Export to PDF ✅ COMPLETED
- [x] Install PDF generation library (`html2pdf.js`)
- [x] Add export button
- [x] Implement PDF generation
- [x] Add loading state
- [x] Test with images and complex formatting
- [x] Optimize PDF file size
- [x] Print-friendly styling for PDF export

### Phase 4: Share Document Link ✅ COMPLETED
- [x] Add share button
- [x] Implement share dialog
- [x] Add copy to clipboard functionality
- [x] Test share link accessibility
- [x] Create dynamic route for shareable links (`/documents/{teamId}/{appId}/{documentId}`)
- [x] Implement document lookup by ID
- [x] Handle base and team documents
- [x] Error handling for missing documents

## Success Criteria

- ✅ Users can print documents with proper formatting
- ✅ Users can export documents to PDF and Markdown
- ✅ Users can share documents via shareable links
- ✅ Export preserves document formatting and styling
- ✅ Share links respect access permissions
- ✅ All features work on desktop and mobile browsers
- ✅ Loading states provide user feedback during export

## Future Enhancements

- **Export to Word**: Export as `.docx` file
- **Export to HTML**: Standalone HTML file export
- **Batch Export**: Export multiple documents at once
- **Scheduled Exports**: Automatic PDF generation and email delivery
- **Share Permissions**: Granular sharing permissions (view-only, edit, etc.)
- **Link Expiration**: Time-limited share links
- **Analytics**: Track document views via share links
- **Export Templates**: Custom PDF templates for different document types

## Related Features

- Document Viewer (current implementation)
- File Upload & Viewing System (for exporting attached files)
- Enhanced Navigation (for share link navigation)
- Toast Notifications (for export/share feedback)

## References

- [MDN: window.print()](https://developer.mozilla.org/en-US/docs/Web/API/Window/print)
- [html2pdf.js Documentation](https://github.com/eKoopmans/html2pdf.js)
- [Turndown Documentation](https://github.com/mixmark-io/turndown)
- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)

---

**Priority**: Medium  
**Estimated Effort**: 2-3 weeks  
**Target Release**: Next sprint after UI improvements

