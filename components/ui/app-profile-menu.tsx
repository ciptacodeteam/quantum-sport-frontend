'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { adminLogoutMutationOptions } from '@/mutations/admin/auth';
import useAuthStore from '@/stores/useAuthStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppUserProfile from './app-user-profile';

const AppProfileMenu = () => {
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const { mutate: mutateLogout, isPending: isLogoutPending } = useMutation(
    adminLogoutMutationOptions({
      onSuccess: () => {
        logout();
        queryClient.clear();
        router.push('/admin/auth/login');
      }
    })
  );

  const onLogout = async () => {
    mutateLogout();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <AppUserProfile />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={'bottom'}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <AppUserProfile />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/admin/pengaturan/akun-saya')}>
            <User />
            Akun Saya
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/admin/pengaturan/notifikasi')}>
            <Bell />
            Notifikasi
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem loading={isLogoutPending} variant="destructive" onSelect={onLogout}>
          <LogOut />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default AppProfileMenu;
