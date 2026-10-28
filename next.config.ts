import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true
            }
          }
        ],
        as: '*.js'
      }
    }
  },
  /* config options here */
  redirects: async () => {
    return [
      ...['/clubs/:path*', '/my-club/:path*', '/tournaments/:path*'].map((source) => ({
        source,
        destination: '/',
        permanent: true
      })),
      ...[
        '/admin/kelola-club/:path*',
        '/admin/kelola-turnamen/:path*',
        '/admin/turnamen/:path*'
      ].map((source) => ({ source, destination: '/admin/dashboard', permanent: true }))
    ];
  },
  // Add proxy to avoid CORS issues
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'https://api.quantumsocialclub.id/:path*'
      }
    ];
  },
  images: {
    // Allow loading images from the local backend server
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**'
      },
      {
        protocol: 'https',
        hostname: 'api.quantumsocialclub.id',
        pathname: '/storage/**'
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
