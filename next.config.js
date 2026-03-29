/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  // Allow building even with TypeScript errors in dev
  typescript: {
    ignoreBuildErrors: false
  }
};

module.exports = nextConfig;
