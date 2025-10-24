'use client';

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

  return <>{children}</>;
};
export default AdminDashboardLayout;
