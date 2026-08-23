import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    qualities: [50, 75, 80, 85, 90, 100], // Configuración de calidades permitidas
  },
  // Turbopack configuration (replaces webpack config)
  experimental: {
    turbo: {
      // Turbopack handles optimization automatically
      // No need for manual chunk splitting configuration
    },
  },
};

export default nextConfig;
