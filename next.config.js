/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  
  webpack: (config, { dev, isServer }) => {
    // Fix for Electron
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
