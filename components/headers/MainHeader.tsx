'use client';

import BranchLabel from '@/components/branches/BranchLabel';
import BranchLink from '@/components/branches/BranchLink';
import LogoImage from '@/assets/img/logoblack.webp';
import { cn } from '@/lib/utils';
import { profileQueryOptions } from '@/queries/profile';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useAuthModalStore from '@/stores/useAuthModalStore';
import CartSheet from '../CartSheet';
import { Button } from '../ui/button';

type Props = {
  showBack?: boolean;
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
  { title: 'Paket Saya', path: '/my-packages', requiresAuth: true },
  { title: 'Riwayat', path: '/invoice', requiresAuth: true }
];

const MainHeader = ({ onBack, backHref, showBack = false }: Props) => {
  const { data: user } = useQuery(profileQueryOptions);
  const pathname = usePathname();
  const router = useRouter();
  const openAuthModal = useAuthModalStore((state) => state.open);
  const openRegister = useAuthModalStore((state) => state.openRegister);
  const isAuthenticated = !!user?.id;
  const showMobileBack = ['/booking', '/booking/tennis', '/terms-and-conditions'].includes(
    pathname
  );

  const handleBack = () => {
    if (onBack) onBack();
    else if (backHref) router.push(backHref);
    else if (window.history.length > 1) router.back();
    else router.push('/');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/booking') return pathname === '/booking';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-[#f8f8f6] text-[#171717]">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 px-5 sm:px-8 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-x-10 2xl:gap-x-14">
          <div className="col-start-1 row-start-1 flex min-h-[76px] min-w-0 items-center gap-2 sm:gap-3">
            {(showBack || showMobileBack) && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Kembali"
                className={cn(
                  'mr-3 flex h-10 w-8 shrink-0 items-center justify-center text-[#171717] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#ad422b]',
                  !showBack && 'mobile-header-back lg:hidden'
                )}
              >
                <ArrowLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            )}
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/"
                aria-label="Black Padel — Beranda"
                className="min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
              >
                <Image
                  src={LogoImage}
                  alt="Black Padel"
                  priority
                  sizes="(min-width: 640px) 104px, 92px"
                  className="h-auto w-[92px] sm:w-[104px]"
                />
              </Link>
              {pathname !== '/' && <BranchLabel />}
            </div>
          </div>
          <nav
            aria-label="Navigasi pelanggan"
            className="col-span-2 col-start-1 row-start-2 hidden min-w-0 items-center gap-6 overflow-x-auto lg:flex xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:gap-5 2xl:gap-7"
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
                <BranchLink
                  key={item.path}
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={className}
                >
                  {item.title}
                </BranchLink>
              );
            })}
          </nav>
          <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-1 sm:gap-2 xl:col-start-3">
            {!isAuthenticated && (
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
            {!isAuthenticated && (
              <span aria-hidden="true" className="mx-2 h-5 w-px bg-black/20 sm:mx-3" />
            )}
            <CartSheet minimal />
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="hidden h-11 lg:block xl:hidden" />
    </>
  );
};

export default MainHeader;
