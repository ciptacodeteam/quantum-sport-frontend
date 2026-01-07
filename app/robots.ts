/* eslint-disable @typescript-eslint/consistent-type-imports */
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/']
    },
    sitemap: 'https://quantumsocialclub.id/sitemap.xml'
  };
}
