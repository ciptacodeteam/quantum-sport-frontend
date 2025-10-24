'use client';

import AppDashboardHeader from '@/components/ui/app-dashboard-header';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { useQuery } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

const AdminDashboardLayout = ({ children }: PropsWithChildren) => {
  const { data: user, isPending, isError } = useQuery(adminProfileQueryOptions);

  if (isPending) {
    return null;
  }

  if (isError || (!isPending && !user?.id)) {
    redirect('/admin/auth/login');
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
