// @vitest-environment node
import 'next/dist/server/node-environment-baseline';
import { expect, it } from 'vitest';
import {
  getRedirectUrl,
  unstable_getResponseFromNextConfig
} from 'next/experimental/testing/server';
import nextConfig from './next.config';

it.each([
  ['/clubs', '/'],
  ['/clubs/old-club', '/'],
  ['/clubs/create', '/'],
  ['/my-club', '/'],
  ['/tournaments', '/'],
  ['/tournaments/old-tournament', '/'],
  ['/admin/kelola-club', '/admin/dashboard'],
  ['/admin/kelola-club/old-club', '/admin/dashboard'],
  ['/admin/kelola-turnamen', '/admin/dashboard'],
  ['/admin/kelola-turnamen/tambah', '/admin/dashboard'],
  ['/admin/kelola-turnamen/old-tournament', '/admin/dashboard'],
  ['/admin/turnamen', '/admin/dashboard'],
  ['/admin/turnamen/old-tournament', '/admin/dashboard']
])('redirects retired feature URL %s to %s', async (path, destination) => {
  const response = await unstable_getResponseFromNextConfig({
    url: `https://example.test${path}`,
    nextConfig
  });
  expect(response.status).toBe(308);
  expect(getRedirectUrl(response)).toBe(`https://example.test${destination}`);
});

it.each(['/', '/booking', '/membership', '/profile', '/admin/dashboard'])(
  'keeps active URL %s available',
  async (path) => {
    const response = await unstable_getResponseFromNextConfig({
      url: `https://example.test${path}`,
      nextConfig
    });
    expect(getRedirectUrl(response)).toBeNull();
  }
);
