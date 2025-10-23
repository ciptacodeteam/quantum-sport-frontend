'use client';

import { logoutMutationOptions } from '@/mutations/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

const LogoutButton = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    logoutMutationOptions({
      onSuccess: () => {
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
