/**
 * PDF.js configuration for Next.js
 * This file ensures PDF.js worker is configured correctly before any PDF components are used
 */

if (typeof window !== 'undefined') {
  // Dynamically import and configure react-pdf worker
  import('react-pdf').then((reactPdf) => {
    // Configure worker using unpkg CDN with .mjs extension
    if (!reactPdf.pdfjs.GlobalWorkerOptions.workerSrc) {
      reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${reactPdf.pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }).catch((error) => {
    console.error('Failed to configure PDF.js worker:', error);
  });
}

