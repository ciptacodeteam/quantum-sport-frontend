import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-cookie';

const ADMIN_AUTH_PREFIX = '/admin/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public admin auth pages (login / register)
  if (pathname === '/admin/auth' || pathname.startsWith(`${ADMIN_AUTH_PREFIX}/`)) {
    return NextResponse.next();
  }

  // Only gate admin app routes
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const hasAdminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value === '1';

    if (!hasAdminSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/auth/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Bare /admin → dashboard when session cookie is present
    if (pathname === '/admin') {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/admin/dashboard';
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*']
};
