/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // This will completely ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // This will ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:9015', '127.0.0.1:9015', '0.0.0.0:3000']
    },
  },
  // Bundle optimization for production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : undefined,
  },
};

module.exports = nextConfig;
