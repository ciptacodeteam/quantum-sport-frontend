import { env } from '@/env';
import useAuthStore from '@/stores/useAuthStore';
import axios, { type AxiosError, HttpStatusCode, type InternalAxiosRequestConfig } from 'axios';

export const adminApi = axios.create({
  baseURL: `${env.NEXT_PUBLIC_API_URL}/admin`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Create a base axios instance for shared endpoints like refresh token
const baseApi = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

adminApi.interceptors.request.use(
  (config: RetryableConfig) => {
    config.headers = config.headers ?? {};

    // Get token directly from Zustand store
    const token = useAuthStore.getState().token;

    if (token) {
      const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      (config.headers as Record<string, string>).Authorization = bearerToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Single-flight refresh ----------
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // Use baseApi to call /auth/refresh-token (not /admin/auth/refresh-token)
      const { data } = await baseApi.post('/auth/refresh-token');
      const newToken = data?.data?.token ?? null;

      if (newToken) {
        useAuthStore.getState().setToken(newToken);
        return newToken;
      }

      // Bad payload -> clear
      useAuthStore.getState().logout();
      return null;
    } catch (err) {
      // Refresh failed -> clear
      console.error('Token refresh failed:', err);
      useAuthStore.getState().logout();
      return null;
    } finally {
      // allow next attempts
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

adminApi.interceptors.response.use(
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

    const token = useAuthStore.getState().token;

    // Try to refresh token on 401 errors (except for refresh endpoint itself)
    if (isAuthError && !isRefreshEndpoint && !originalRequest?._retry && !!token) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        // Retry the original request with new token
        originalRequest._retry = true;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return adminApi(originalRequest);
      }

      // Refresh failed -> logout
      useAuthStore.getState().logout();
    } else if (isAuthError) {
      // Explicit 401 with no refresh path (e.g., refresh endpoint failed)
      useAuthStore.getState().logout();
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
