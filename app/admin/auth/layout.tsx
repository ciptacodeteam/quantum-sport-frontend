'use client';

import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { hasAdminSessionCookie } from '@/lib/admin-session';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

const AdminAuthLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
    setHasSession(hasAdminSessionCookie());
  }, []);

  const { data: user, isPending } = useQuery({
    ...adminProfileQueryOptions,
    enabled: isHydrated && hasSession
  });

  useEffect(() => {
    if (hasRedirected.current || !isHydrated) return;

    if (hasSession && !isPending && !!user?.id) {
      hasRedirected.current = true;
      router.replace('/admin/dashboard');
    }
  }, [isHydrated, hasSession, isPending, user, router]);

  if (!isHydrated) {
    return null;
  }

  if (hasSession && isPending) {
    return null;
  }

  if (hasSession && !!user?.id) {
    return null;
  }

  return (
    <div className="bg-muted flex-center min-h-svh flex-col p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">{children}</div>
    </div>
  );
};
export default AdminAuthLayout;
