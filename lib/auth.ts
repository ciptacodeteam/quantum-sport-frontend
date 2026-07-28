import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-cookie';

/** Server-side check used by RSC / server layouts for admin session presence. */
export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return session === '1';
}

/** @deprecated Use isAdminAuthenticated for admin gates. */
export async function isAuthenticated() {
  return isAdminAuthenticated();
}
