import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // ✨ ADD THIS LINE
  
  typescript: {
    ignoreBuildErrors: false,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: true,
  // Don't use static export for Electron - keep server-side rendering
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
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
