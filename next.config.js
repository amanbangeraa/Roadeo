/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['firebase', 'firebase-admin'],
  },
};

module.exports = nextConfig;