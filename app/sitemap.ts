import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${siteUrl}/booking`,
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${siteUrl}/membership`,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${siteUrl}/coaches`,
      changeFrequency: 'weekly',
      priority: 0.6
    },
    {
      url: `${siteUrl}/informations`,
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${siteUrl}/terms-and-conditions`,
      changeFrequency: 'monthly',
      priority: 0.3
    }
  ];
}
