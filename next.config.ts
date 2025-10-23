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
  images: {
    // Allow loading images from the local backend server
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: 'storages/**'
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
