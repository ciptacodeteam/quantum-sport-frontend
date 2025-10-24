'use client';

import { Button } from '@/components/ui/button';
import { adminLogoutMutationOptions } from '@/mutations/admin/auth';
import useAuthStore from '@/stores/useAuthStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminLogoutMutationOptions({
      onSuccess: () => {
        logout();
        queryClient.clear();
        router.push('/admin/auth/login');
      }
    })
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Admin Dashboard</h1>
      <Button variant="destructive" onClick={() => mutate()} disabled={isPending}>
        Logout
      </Button>
    </div>
  );
}
