'use client';

import AppDashboardHeader from '@/components/ui/app-dashboard-header';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
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
  const hasRedirected = useRef(false);

  // Read directly from store during render (after hydration)
  const token = useAuthStore((state) => state.token);
  const persistedUser = useAuthStore((state) => state.user);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    data: user,
    isPending,
    isError,
    error
  } = useQuery({
    ...adminProfileQueryOptions,
    enabled: isHydrated && !!token && !persistedUser, // Only fetch if we don't have user in store
    retry: false,
    staleTime: Infinity, // Keep cached data forever until manually invalidated
    gcTime: Infinity, // Don't garbage collect
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  // Sync fetched user to Zustand store
  useEffect(() => {
    if (user && !persistedUser) {
      // console.log('💾 Saving user to Zustand store:', user.name);
      // Store as any to avoid type mismatch between AdminProfile and UserProfile
      useAuthStore.getState().setUser(user as any);
    }
  }, [user, persistedUser]);

  // Get current user (prefer persisted, fallback to fetched)
  const currentUser = persistedUser || user;

  // Debug logging
  // useEffect(() => {
  //   console.log('🔒 Admin Auth Debug:', {
  //     isHydrated,
  //     token: token ? `${token.substring(0, 20)}...` : null,
  //     hasToken: !!token,
  //     isPending,
  //     isError,
  //     hasUser: !!(user || persistedUser),
  //     persistedUser: persistedUser?.name || null,
  //     fetchedUser: user?.name || null,
  //     errorDetails: error,
  //     hasRedirected: hasRedirected.current
  //   });
  // }, [isHydrated, token, isPending, isError, user, persistedUser, error]);

  // Handle redirects - only redirect once
  useEffect(() => {
    if (!isHydrated || hasRedirected.current) return;

    if (!token) {
      console.log('❌ No token found, redirecting to login');
      hasRedirected.current = true;
      router.replace('/admin/auth/login');
      return;
    }

    // If query finished with error and we don't have persisted user, check if it's auth related
    if (!isPending && isError && !persistedUser) {
      console.log('❌ Query error:', error);
      // Clear query cache and token, then redirect
      hasRedirected.current = true;
      queryClient.clear(); // Clear all cached queries
      useAuthStore.getState().logout();
      router.replace('/admin/auth/login');
    }
  }, [isHydrated, token, isPending, isError, error, router, queryClient, persistedUser]);

  // Show loading state
  if (!isHydrated || !token) {
    return null;
  }

  // Show loading while fetching profile (only if we don't have persisted user)
  if (isPending && !persistedUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if there's an error (will redirect)
  if (isError && !persistedUser) {
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
