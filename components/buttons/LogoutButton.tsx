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
        logout();
        router.refresh();
        queryClient.clear();
      }
    })
  );

  const handleLogout = () => {
    // Implement logout logic here
    console.log('User logged out');
    mutate();
  };

  return (
    <Button variant={'destructive'} onClick={handleLogout} disabled={isPending}>
      Logout
    </Button>
  );
};
export default LogoutButton;
