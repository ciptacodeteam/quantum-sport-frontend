'use client';

import { logoutMutationOptions } from '@/mutations/auth';
import useAuthStore from '@/stores/useAuthStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';

const LogoutButton = () => {
  const queryClient = useQueryClient();

  const logout = useAuthStore((state) => state.logout);

  const { mutate, isPending } = useMutation(
    logoutMutationOptions({
      onSuccess: () => {
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
