import { env } from '@/env';
import axios, { type AxiosError, HttpStatusCode } from 'axios';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let waiters: Array<() => void> = [];

async function handleRequestError(err: AxiosError) {
  if (err.response?.status !== 401) throw err;

  if (!isRefreshing) {
    isRefreshing = true;
    try {
      // Proxy that forwards Set-Cookie from backend refresh to browser
      await fetch('/auth/refresh', { method: 'POST', cache: 'no-store' });
      waiters.forEach((w) => w());
      waiters = [];
      return api(err.config!);
    } catch (e) {
      waiters = [];
      throw e;
    } finally {
      isRefreshing = false;
    }
  }

  await new Promise<void>((resolve) => waiters.push(resolve));
  return api(err.config!);
}

async function handleResponseError(error: AxiosError<any>) {
  if (!error.response) {
    // Network/CORS
    return Promise.reject(error);
  }

  // const { status } = error.response;
  // const isAuthError = status === HttpStatusCode.Unauthorized;

  let newResponse = error.response?.data || error.message;

  if (error?.code === 'ERR_NETWORK') {
    newResponse = {
      ...error.response?.data,
      message: 'Maaf, terjadi kesalahan jaringan. Silakan coba lagi nanti.'
    };
  }

  // if (isAuthError && error.config?.url !== '/auth/login') {
  //   // Refresh unavailable/failed -> sign out & redirect
  //   useAuthStore.getState().logout();

  //   if (isBrowser) {
  //     window.location.href = '/auth/login';
  //   }
  // }

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

api.interceptors.response.use((r) => r, handleRequestError);

api.interceptors.response.use((response) => response, handleResponseError);
