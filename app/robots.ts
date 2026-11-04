import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/api-proxy/',
        '/admin',
        '/profile',
        '/notifications',
        '/invoice',
        '/my-packages',
        '/sports',
        '/checkout',
        '/membership/checkout',
        '/add-ons',
        '/payment/',
        '/preview/',
        '/reset-password'
      ]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
