import { refreshTokenApi } from '@/api/auth';
import { env } from '@/env';
import { normalizeApiErrorResponse } from '@/lib/api-error';
import useAuthStore from '@/stores/useAuthStore';
import axios, { type AxiosError, HttpStatusCode, type InternalAxiosRequestConfig } from 'axios';
import { isJwtAndDecode } from './utils';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// ---------- Single-flight refresh (cookie-based session) ----------
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await refreshTokenApi();
      const ok = res?.success === true || !!res?.data?.token;

      if (ok) {
        useAuthStore.getState().setAuth(true);
        return true;
      }

      useAuthStore.getState().logout();
      return false;
    } catch {
      useAuthStore.getState().logout();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.request.use(
  async (config: RetryableConfig) => {
    config.headers = config.headers ?? {};

    const token = useAuthStore.getState().token;

    if (token) {
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      await isJwtAndDecode(token);
      (config.headers as Record<string, string>).Authorization = bearerToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    if (!error.response) {
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

    if (isAuthError && !isRefreshEndpoint && !originalRequest?._retry) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        originalRequest._retry = true;
        return api(originalRequest);
      }

      useAuthStore.getState().logout();
      useAuthStore.getState().setLoading(false);
    } else if (isAuthError) {
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

    if (newResponse && typeof newResponse === 'object') {
      return Promise.reject(normalizeApiErrorResponse(newResponse as Record<string, unknown>));
    }

    return Promise.reject(newResponse);
  }
);
