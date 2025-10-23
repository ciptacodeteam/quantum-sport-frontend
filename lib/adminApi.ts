import { env } from '@/env';
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

export const adminApi = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL + '/admin',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let waiters: Array<() => void> = [];

// Helper: is this call an auth route? Never refresh-loop on these.
function isAuthRoute(config?: AxiosRequestConfig) {
  const url = (config?.url || '').toLowerCase();
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

async function runRefresh() {
  // Use your Next route *proxy* so Set-Cookie reaches the browser
  const r = await fetch('/api/auth/refresh-admin', { method: 'POST', cache: 'no-store' });
  if (!r.ok) throw new Error('refresh-failed');
}

adminApi.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const cfg = err.config as AxiosRequestConfig | undefined;

    // If no response or not 401 -> bubble
    if (err.response?.status !== 401 || !cfg) throw err;

    // Do NOT try to refresh for auth endpoints or when explicitly disabled
    if (cfg.skipAuthRefresh || isAuthRoute(cfg)) throw err;

    // Prevent infinite loop: only retry a given request once
    if (cfg._retry) {
      // optional: force logout/redirect here
      // window.location.href = '/admin/auth/login'
      throw err;
    }
    cfg._retry = true;

    // Coalesce concurrent 401s behind a single refresh call
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        await runRefresh();
        // wake everyone waiting
        waiters.forEach((w) => w());
        waiters = [];
      } catch (e) {
        // wake with failure → their retry will throw because refresh didn't fix it
        waiters.forEach((w) => w());
        waiters = [];
        throw e;
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait until the in-flight refresh finishes
      await new Promise<void>((resolve) => waiters.push(resolve));
    }

    // Retry the original request once (cookies should be updated now)
    return adminApi(cfg);
  }
);
