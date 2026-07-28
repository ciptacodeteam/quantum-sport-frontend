import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-cookie';

export { ADMIN_SESSION_COOKIE };

const ONE_DAY_SECONDS = 60 * 60 * 24;

function isSecureContext() {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

/**
 * Marks an admin browser session for Next.js middleware.
 * Real authorization still happens on the API via Bearer token.
 */
export function setAdminSessionCookie() {
  if (typeof document === 'undefined') return;

  const secure = isSecureContext() ? '; Secure' : '';
  document.cookie = `${ADMIN_SESSION_COOKIE}=1; Path=/; Max-Age=${ONE_DAY_SECONDS}; SameSite=Lax${secure}`;
}

export function clearAdminSessionCookie() {
  if (typeof document === 'undefined') return;

  const secure = isSecureContext() ? '; Secure' : '';
  document.cookie = `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function hasAdminSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split(';')
    .some((part) => part.trim().startsWith(`${ADMIN_SESSION_COOKIE}=`));
}
