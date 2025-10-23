import { refreshTokenApi } from '@/api/auth';
import { env } from '@/env';
import useAuthStore from '@/stores/useAuthStore';
import axios, { type AxiosError, HttpStatusCode, type InternalAxiosRequestConfig } from 'axios';
import { isJwtAndDecode } from './utils';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// ---------- Runtime guards ----------
const isBrowser = typeof window !== 'undefined';

// ---------- Local storage helpers (SSR-safe) ----------
const storage = {
  get(key: string) {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, val: string) {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, val);
    } catch {
      // Ignore errors
    }
  },
  remove(key: string) {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
};

api.interceptors.request.use(
  async (config: RetryableConfig) => {
    config.headers = config.headers ?? {};

    // Auth header
    const token = storage.get('token') || useAuthStore.getState().token;

    if (token) {
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      const { isJwt } = await isJwtAndDecode(token);

      if (!isJwt) {
        // If token is not a valid JWT, remove it from storage and state
        storage.remove('token');
        useAuthStore.getState().logout();
        return config;
      }
      (config.headers as Record<string, string>).Authorization = bearerToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Single-flight refresh (Zustand-aware) ----------
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await refreshTokenApi();
      const newToken = res?.data?.token ?? null;

      if (newToken) {
        storage.set('token', newToken);
        useAuthStore.getState().setToken(newToken);
        return newToken;
      }

      // Bad payload -> clear
      storage.remove('token');
      return null;
    } catch {
      // Refresh failed -> clear
      storage.remove('token');
      return null;
    } finally {
      // allow next attempts
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    if (!error.response) {
      // Network/CORS
      return Promise.reject(error);
    }

    const { status } = error.response;
    const originalRequest = error.config as RetryableConfig;
    const isAuthError = status === HttpStatusCode.Unauthorized;
    const isRefreshEndpoint = (originalRequest?.url || '').includes('/auth/refresh-token');

    let newResponse = error.response?.data || error.message;

    if (error?.code === 'ERR_NETWORK') {
      newResponse = {
        ...error.response?.data,
        message: 'Maaf, terjadi kesalahan jaringan. Silakan coba lagi nanti.'
      };
    }

    const token = storage.get('token') || useAuthStore.getState().token;

    if (isAuthError && !isRefreshEndpoint && !originalRequest?._retry && !!token) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest._retry = true;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // Refresh unavailable/failed -> sign out & redirect
      storage.remove('token');
      useAuthStore.getState().logout();
      useAuthStore.getState().setLoading(false);
    } else if (isAuthError) {
      // Explicit 401 with no refresh path
      storage.remove('token');
      useAuthStore.getState().logout();
      useAuthStore.getState().setLoading(false);
    }

    if (error.response?.status == HttpStatusCode.Forbidden) {
      newResponse = {
        ...error.response?.data,
        message: 'Maaf, Anda tidak memiliki izin untuk mengakses sumber daya ini.'
      };
    }

    if (error.response?.status == HttpStatusCode.InternalServerError) {
      newResponse = {
        ...error.response?.data,
        message: 'Maaf, terjadi kesalahan pada server. Silakan coba lagi nanti.'
      };
    }

    return Promise.reject(newResponse);
  }
);
