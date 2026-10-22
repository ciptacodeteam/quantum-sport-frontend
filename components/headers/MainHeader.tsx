'use client';

import LogoImage from '@/assets/img/logoblack.webp';
import { cn } from '@/lib/utils';
import { profileQueryOptions } from '@/queries/profile';
import { useQuery } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthModalStore from '@/stores/useAuthModalStore';
import CartSheet from '../CartSheet';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';

type Props = {
  onBack?: () => void;
  backHref?: string;
  withLogo?: boolean;
  title?: string;
  withBorder?: boolean;
  withNotificationBadge?: boolean;
  withCartBadge?: boolean;
};

const navItems = [
  { title: 'Beranda', path: '/' },
  { title: 'Padel', path: '/booking' },
  { title: 'Tennis', path: '/booking/tennis' },
  { title: 'Value Pack', path: '/membership' },
  { title: 'Riwayat', path: '/invoice', requiresAuth: true }
];

const MainHeader = (_props: Props) => {
  const { data: user } = useQuery(profileQueryOptions);
  const pathname = usePathname();
  const openAuthModal = useAuthModalStore((state) => state.open);
  const openRegister = useAuthModalStore((state) => state.openRegister);
  const isAuthenticated = !!user?.id;

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/booking') return pathname === '/booking';
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  const accountButton = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isAuthenticated ? 'Buka menu akun' : 'Masuk atau daftar akun'}
      className="rounded-none text-black hover:bg-black/5"
    >
      <UserRound className="size-5" strokeWidth={1.5} />
    </Button>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-[#f8f8f6] text-[#171717]">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 px-5 sm:px-8 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-x-10 2xl:gap-x-14">
          <div className="col-start-1 row-start-1 flex min-h-[76px] min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Black Padel — Beranda"
              className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
              <Image
                src={LogoImage}
                alt="Black Padel"
                priority
                sizes="(min-width: 640px) 104px, 92px"
                className="h-auto w-[92px] sm:w-[104px]"
              />
            </Link>
          </div>
          <nav
            aria-label="Navigasi pelanggan"
            className="col-span-2 col-start-1 row-start-2 flex min-w-0 items-center gap-6 overflow-x-auto xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:gap-5 2xl:gap-7"
          >
            {navItems.map((item) => {
              const active = isActive(item.path);
              const className = cn(
                'flex min-h-11 shrink-0 items-center py-3 text-xs font-medium whitespace-nowrap transition-colors hover:text-black focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black xl:min-h-[76px] xl:text-[13px]',
                active ? 'text-black' : 'text-black/60'
              );
              if (item.requiresAuth && !isAuthenticated) {
                return (
                  <button
                    key={item.path}
                    type="button"
                    className={className}
                    onClick={openAuthModal}
                  >
                    {item.title}
                  </button>
                );
              }
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={className}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
          <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-1 sm:gap-2 xl:col-start-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>{accountButton}</DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={12}
                  className="min-w-44 border-black/10 bg-[#f8f8f6] p-2 text-[#171717]"
                >
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profil saya</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/invoice">Riwayat pemesanan</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications">Notifikasi</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  className="h-9 rounded-full px-3 text-xs font-medium text-black hover:bg-black/5 sm:px-4"
                  onClick={openAuthModal}
                >
                  Login
                </Button>
                <Button
                  className="h-9 rounded-full bg-[#111111] px-4 text-xs font-medium text-white hover:bg-black/80 sm:px-5"
                  onClick={openRegister}
                >
                  Daftar
                </Button>
              </div>
            )}
            <span aria-hidden="true" className="mx-2 h-5 w-px bg-black/20 sm:mx-3" />
            <CartSheet minimal />
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="h-11 xl:hidden" />
    </>
  );
};

export default MainHeader;
