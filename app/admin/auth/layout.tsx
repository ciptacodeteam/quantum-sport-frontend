'use client';

import { adminProfileQueryOptions } from '@/queries/admin/auth';
import useAuthStore from '@/stores/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

const AdminAuthLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const hasRedirected = useRef(false);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
    const currentToken = useAuthStore.getState().token;
    setToken(currentToken);
    console.log('🔐 Auth Layout: Hydration complete, token:', currentToken ? 'exists' : 'none');
  }, []);

  const { data: user, isPending } = useQuery({
    ...adminProfileQueryOptions,
    enabled: isHydrated && !!token
  });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (hasRedirected.current || !isHydrated) return;

    if (token && !isPending && !!user?.id) {
      console.log('✅ Auth Layout: Already logged in, redirecting to dashboard');
      hasRedirected.current = true;
      router.replace('/admin/dashboard');
    }
  }, [isHydrated, token, isPending, user, router]);

  // Show nothing while hydrating
  if (!isHydrated) {
    return null;
  }

  // If there's a token, wait for profile check before showing login
  if (token && isPending) {
    return null;
  }

  // If logged in, show nothing (will redirect)
  if (token && !!user?.id) {
    return null;
  }

  // Show auth pages if no token OR if token is invalid
  return (
    <div className="bg-muted flex-center min-h-svh flex-col p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">{children}</div>
    </div>
  );
};
export default AdminAuthLayout;
