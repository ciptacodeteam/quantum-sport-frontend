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
    <div className="flex-center min-h-screen flex-col gap-6 bg-gray-100">
      <h1 className="text-2xl font-bold">DashboardPage</h1>

      <Button loading={isPending} onClick={() => mutate()} className="mt-4">
        Logout
      </Button>
    </div>
  );
}
