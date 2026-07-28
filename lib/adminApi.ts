import { env } from '@/env';
import { normalizeApiErrorResponse } from '@/lib/api-error';
import { clearAdminSessionCookie, setAdminSessionCookie } from '@/lib/admin-session';
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

function adminLogout() {
  clearAdminSessionCookie();
  useAuthStore.getState().logout();
}

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
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { data } = await baseApi.post('/admin/auth/refresh-token');
      const ok = data?.success === true || !!data?.data?.token;

      if (ok) {
        useAuthStore.getState().setAuth(true);
        setAdminSessionCookie();
        return true;
      }

      adminLogout();
      return false;
    } catch (err) {
      console.error('Token refresh failed:', err);
      adminLogout();
      return false;
    } finally {
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

    if (isAuthError && !isRefreshEndpoint && !originalRequest?._retry) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        originalRequest._retry = true;
        return adminApi(originalRequest);
      }

      adminLogout();
    } else if (isAuthError) {
      // Explicit 401 with no refresh path (e.g., refresh endpoint failed)
      adminLogout();
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
