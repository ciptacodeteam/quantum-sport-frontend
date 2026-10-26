'use client';

import { useLogoutConfirmation } from '@/hooks/useLogoutConfirmation';

import { logoutMutationOptions } from '@/mutations/auth';
import useAuthStore from '@/stores/useAuthStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';

const LogoutButton = () => {
  const queryClient = useQueryClient();
  const confirmLogout = useLogoutConfirmation();

  const logout = useAuthStore((state) => state.logout);

  const { mutate, isPending } = useMutation(
    logoutMutationOptions({
      onSuccess: () => {
        queryClient.clear();
        logout();
      }
    })
  );

  const handleLogout = async () => {
    if (isPending) return;
    if (await confirmLogout()) {
      mutate();
    }
  };

  return (
    <Button variant={'destructive'} onClick={handleLogout} disabled={isPending}>
      Logout
    </Button>
  );
};
export default LogoutButton;
