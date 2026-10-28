'use client';

import { useLogoutConfirmation } from '@/hooks/useLogoutConfirmation';

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
import { clearAdminSessionCookie } from '@/lib/admin-session';
import useAuthStore from '@/stores/useAuthStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppUserProfile from './app-user-profile';

const AppProfileMenu = () => {
  const router = useRouter();
  const confirmLogout = useLogoutConfirmation();

  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const { mutate: mutateLogout, isPending: isLogoutPending } = useMutation(
    adminLogoutMutationOptions({
      onSuccess: () => {
        clearAdminSessionCookie();
        logout();
        queryClient.clear();
        router.push('/admin/auth/login');
      },
      onError: () => {
        clearAdminSessionCookie();
        logout();
        queryClient.clear();
        router.push('/admin/auth/login');
      }
    })
  );

  const onLogout = async () => {
    if (isLogoutPending) return;
    if (await confirmLogout()) {
      mutateLogout();
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-muted focus-visible:ring-ring flex min-w-0 shrink-0 items-center gap-2 rounded-lg px-2 outline-none focus-visible:ring-2"
        aria-label="Menu akun"
      >
        <AppUserProfile compact />
        <ChevronDown className="text-muted-foreground hidden size-4 sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-72 max-w-[calc(100vw-24px)] rounded-xl p-2"
        side={'bottom'}
        align="end"
        sideOffset={8}
        collisionPadding={12}
      >
        <DropdownMenuLabel className="px-2 py-1 font-normal">
          <AppUserProfile />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="rounded-lg px-3 py-2.5"
            onClick={() => router.push('/admin/pengaturan/akun-saya')}
          >
            <User />
            Akun Saya
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-lg px-3 py-2.5"
            onClick={() => router.push('/admin/pengaturan/notifikasi')}
          >
            <Bell />
            Notifikasi
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-lg px-3 py-2.5"
          loading={isLogoutPending}
          variant="destructive"
          onSelect={onLogout}
        >
          <LogOut />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default AppProfileMenu;
