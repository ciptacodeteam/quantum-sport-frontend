'use client';

import { logoutMutationOptions } from '@/mutations/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/useAuthStore';

const LogoutButton = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = useAuthStore((state) => state.logout);

  const { mutate, isPending } = useMutation(
    logoutMutationOptions({
      onSuccess: () => {
        router.push('/admin/auth/login');
        queryClient.clear();
        logout();
      }
    })
  );

  const handleLogout = () => {
    mutate();
  };

  return (
    <Button variant={'destructive'} onClick={handleLogout} disabled={isPending}>
      Logout
    </Button>
  );
};
export default LogoutButton;
