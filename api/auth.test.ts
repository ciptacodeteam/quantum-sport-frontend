import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_SESSION_COOKIE,
  clearAdminSessionCookie,
  hasAdminSessionCookie,
  setAdminSessionCookie
} from '@/lib/admin-session';

const mocks = vi.hoisted(() => ({
  customerPost: vi.fn(),
  customerGet: vi.fn(),
  adminPost: vi.fn(),
  adminGet: vi.fn()
}));

vi.mock('@/lib/api', () => ({
  api: { post: mocks.customerPost, get: mocks.customerGet }
}));
vi.mock('@/lib/adminApi', () => ({
  adminApi: { post: mocks.adminPost, get: mocks.adminGet }
}));

import { getProfileApiSmart, logoutApi } from './auth';

describe('shared profile session', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearAdminSessionCookie();
  });
  afterEach(() => clearAdminSessionCookie());

  it('logs out a customer through the customer endpoint', async () => {
    mocks.customerPost.mockResolvedValue({ data: { success: true } });
    await expect(logoutApi()).resolves.toEqual({ success: true });
    expect(mocks.customerPost).toHaveBeenCalledWith('/auth/logout');
    expect(mocks.adminPost).not.toHaveBeenCalled();
  });

  it('ends the admin session shown on the customer profile and removes its marker', async () => {
    setAdminSessionCookie();
    expect(document.cookie).toContain(`${ADMIN_SESSION_COOKIE}=1`);
    mocks.adminPost.mockResolvedValue({ data: { success: true } });
    await expect(logoutApi()).resolves.toEqual({ success: true });
    expect(mocks.adminPost).toHaveBeenCalledWith('/auth/logout');
    expect(mocks.customerPost).not.toHaveBeenCalled();
    expect(hasAdminSessionCookie()).toBe(false);
  });

  it('does not report success or discard the marker when admin logout fails', async () => {
    setAdminSessionCookie();
    mocks.adminPost.mockRejectedValue(new Error('Network unavailable'));
    await expect(logoutApi()).rejects.toThrow('Network unavailable');
    expect(hasAdminSessionCookie()).toBe(true);
  });

  it('reads the customer profile after the admin session has ended', async () => {
    setAdminSessionCookie();
    mocks.adminPost.mockResolvedValue({ data: { success: true } });
    mocks.customerGet.mockResolvedValue({ data: { data: null } });
    await logoutApi();
    await expect(getProfileApiSmart()).resolves.toEqual({ data: null });
    expect(mocks.customerGet).toHaveBeenCalledWith('/auth/profile', { signal: undefined });
    expect(mocks.adminGet).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'allows an in-flight profile request to be cancelled (admin=%s)',
    async (admin) => {
      if (admin) setAdminSessionCookie();
      const signal = new AbortController().signal;
      const get = admin ? mocks.adminGet : mocks.customerGet;
      get.mockResolvedValue({ data: { data: { id: 'account' } } });
      await getProfileApiSmart({ signal });
      expect(get).toHaveBeenCalledWith('/auth/profile', { signal });
    }
  );
});
