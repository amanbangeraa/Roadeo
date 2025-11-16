/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['firebase', 'firebase-admin'],
    // Increase timeout for static generation to prevent build failures
    staticPageGenerationTimeout: 180,
  },
};

module.exports = nextConfig;