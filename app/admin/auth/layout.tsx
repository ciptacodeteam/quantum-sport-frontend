'use client';

import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { useQuery } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

const AdminAuthLayout = ({ children }: PropsWithChildren) => {
  const { data: user, isPending } = useQuery(adminProfileQueryOptions);

  if (isPending) {
    return null;
  }

  if (!isPending && !!user?.id) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="bg-muted flex-center min-h-svh flex-col p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">{children}</div>
    </div>
  );
};
export default AdminAuthLayout;
