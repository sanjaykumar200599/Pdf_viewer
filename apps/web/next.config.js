/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@repo/types'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  webpack: (config) => {
    // Handle canvas for react-pdf
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  }
};

module.exports = nextConfig;