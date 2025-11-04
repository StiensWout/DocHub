/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: transpilePackages removed as it may cause webpack to incorrectly process pdfjs-dist
  // Using webpack config instead to handle pdfjs-dist properly
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
    };
    
    // Exclude winston from client bundle to avoid fs module errors
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      
      // Fix for pdfjs-dist Object.defineProperty error
      // Prevent webpack from incorrectly processing pdfjs-dist ES modules
      // Exclude pdfjs-dist from optimizations that cause Object.defineProperty errors
      if (config.optimization) {
        config.optimization = {
          ...config.optimization,
          moduleIds: 'deterministic',
        };
      }
      
      // Tell webpack to treat pdfjs-dist modules as raw source without transformation
      config.module.rules.push({
        test: /node_modules[\\/]pdfjs-dist[\\/].*\.(js|mjs)$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
        // Prevent webpack from parsing/transforming these modules
        parser: {
          javascript: {
            exportsPresence: false,
            // Disable commonjs detection
            commonjs: false,
            // Disable AMD detection
            amd: false,
          },
        },
      });
      
      // Specifically handle the pdf.mjs file that's causing the error
      config.module.rules.push({
        test: /node_modules[\\/]pdfjs-dist[\\/]build[\\/]pdf\.mjs$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
        parser: {
          javascript: {
            exportsPresence: false,
            commonjs: false,
            amd: false,
          },
        },
      });
    }
    
    return config;
  },
};

export default nextConfig;
