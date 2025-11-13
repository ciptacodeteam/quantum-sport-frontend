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
      {
        source: '/admin',
        destination: '/admin/auth/login',
        permanent: true
      }
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
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
