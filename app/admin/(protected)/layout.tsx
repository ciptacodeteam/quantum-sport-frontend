'use client';

import AppDashboardHeader from '@/components/ui/app-dashboard-header';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { clearAdminSessionCookie, hasAdminSessionCookie } from '@/lib/admin-session';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import useAuthStore from '@/stores/useAuthStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

const AdminDashboardLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const hasRedirected = useRef(false);

  const persistedUser = useAuthStore((state) => state.user);

  useEffect(() => {
    setIsHydrated(true);
    setHasSession(hasAdminSessionCookie());
  }, []);

  const {
    data: user,
    isPending,
    isError,
    error
  } = useQuery({
    ...adminProfileQueryOptions,
    enabled: isHydrated && hasSession,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  useEffect(() => {
    if (user) {
      useAuthStore.getState().setUser(user as any);
      useAuthStore.getState().setAuth(true);
    }
  }, [user]);

  const currentUser = user || persistedUser;

  useEffect(() => {
    if (!isHydrated || hasRedirected.current) return;

    if (!hasSession) {
      hasRedirected.current = true;
      clearAdminSessionCookie();
      router.replace('/admin/auth/login');
      return;
    }

    if (!isPending && isError) {
      hasRedirected.current = true;
      queryClient.clear();
      clearAdminSessionCookie();
      useAuthStore.getState().logout();
      router.replace('/admin/auth/login');
    }
  }, [isHydrated, hasSession, isPending, isError, error, router, queryClient]);

  if (!isHydrated || !hasSession) {
    return null;
  }

  if (isPending && !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError && !currentUser) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppDashboardHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};
export default AdminDashboardLayout;
