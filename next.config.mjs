/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile pdfjs-dist to fix Object.defineProperty errors
  transpilePackages: ['pdfjs-dist'],
  eslint: {
    // Ignore ESLint errors during builds (CI will catch these separately)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds (CI will catch these separately)
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Configure aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      // Fix for react-pdf/pdfjs-dist webpack bundling issues (client-side only)
      ...(!isServer && {
        'pdfjs-dist/build/pdf.worker.mjs': require.resolve('pdfjs-dist/build/pdf.worker.mjs'),
      }),
    };
    
    // Exclude winston from client bundle to avoid fs module errors
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    // Fix for pdfjs-dist Object.defineProperty error
    // This ensures pdfjs-dist modules are properly handled by webpack
    // The error occurs because webpack tries to process pdfjs-dist incorrectly
    config.module.rules.push({
      test: /node_modules\/pdfjs-dist\/.*\.js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });
    
    return config;
  },
};

export default nextConfig;
