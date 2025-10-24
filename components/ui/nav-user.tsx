'use client';

import { Bell, ChevronsUpDown, LogOut, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { getNameInitial, getTwoWordName } from '@/lib/utils';
import { logoutMutationOptions } from '@/mutations/auth';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import useAuthStore from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import AppUserProfile from './app-user-profile';
import { Skeleton } from './skeleton';

export function NavUser() {
  const { isMobile } = useSidebar();

  const { data: user, isPending } = useQuery(adminProfileQueryOptions);

  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const { mutate: logoutMutate, isPending: isLogoutPending } = useMutation(
    logoutMutationOptions({
      onSuccess: () => {
        logout();
        router.push('/admin/auth/login');
        queryClient.clear();
      }
    })
  );

  const onLogout = async () => {
    logoutMutate();
  };

  if (isPending || !user) {
    return <Skeleton className="h-10 w-full rounded-lg" />;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.image && <AvatarImage src={user.image} alt={user.name} />}
                <AvatarFallback className="rounded-lg">{getNameInitial(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{getTwoWordName(user.name)}</span>
                <span className="line-clamp-1 truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
