'use client';

import LogoImage from '@/assets/img/logo.svg';
import { cn } from '@/lib/utils';
import { profileQueryOptions } from '@/queries/profile';
import { IconBellFilled } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import CartSheet from '../CartSheet';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { usePathname } from 'next/navigation';
import useAuthModalStore from '@/stores/useAuthModalStore';

type Props = {
  onBack?: () => void;
  backHref?: string;
  withLogo?: boolean;
  title?: string;
  withNotificationBadge?: boolean;
  withCartBadge?: boolean;
};

const MainHeader = ({
  onBack,
  backHref,
  withLogo = true,
  title,
  withNotificationBadge,
  withCartBadge
}: Props) => {
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const pathname = usePathname();
  const openAuthModal = useAuthModalStore((state) => state.open);

  const isBeranda = pathname === '/';
  const isAuthenticated = !!user?.id;

  const navItems = [
    { title: 'Beranda', path: '/' },
    { title: 'Pemesanan', path: '/booking' },
    { title: 'Riwayat', path: '/invoice', requiresAuth: true },
    { title: 'Profil', path: '/profile', requiresAuth: true }
  ];

  return (
    <>
      <header className={cn('fixed top-0 right-0 left-0 z-40 border-b bg-white')}>
        <div className="mx-auto w-11/12 px-2 py-2 lg:max-w-7xl lg:px-4">
          <main
            className={cn(
              'flex min-h-16 items-center gap-4 lg:min-h-[72px]',
              isBeranda ? 'justify-between' : 'justify-start'
            )}
          >
            {/* Kiri: tombol back / title */}
            {(onBack || backHref || title) && (
              <div className="flex items-center gap-6">
                {onBack && (
                  <Button variant="light" size="icon-sm" onClick={onBack}>
                    <ChevronLeft className="size-6" />
                  </Button>
                )}
                {backHref && (
                  <Link href={backHref}>
                    <Button variant="light" size="icon-sm">
                      <ChevronLeft className="size-6" />
                    </Button>
                  </Link>
                )}
                {title && (
                  <h1 className="text-primary text-lg font-semibold lg:text-xl">{title}</h1>
                )}
              </div>
            )}

            {/* Tengah: Logo */}
            {withLogo && (
              <Link href="/" prefetch>
                <div className="relative flex h-16 w-28 items-center justify-center">
                  <LogoImage className="absolute inset-0 h-full w-full object-contain" />
                </div>
              </Link>
            )}

            {/* Kanan: Navigasi + Notifikasi */}
            <div className="ml-auto flex items-center justify-end gap-6">
              {/* Menu navigasi (desktop only) */}
              <div className="hidden items-center gap-8 lg:flex">
                {navItems.map((item, index) => {
                  const requiresAuth = item.requiresAuth ?? false;

                  if (requiresAuth && !isAuthenticated) {
                    return (
                      <button
                        key={item.path || `nav-item-${index}`}
                        onClick={openAuthModal}
                        className={cn(
                          'hover:text-primary text-gray-600 transition-colors',
                          pathname === item.path && 'text-primary font-medium'
                        )}
                      >
                        {item.title}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.path || `nav-item-${index}`}
                      href={item.path || '/'}
                      className={cn(
                        'hover:text-primary text-gray-600 transition-colors',
                        pathname === item.path && 'text-primary font-medium'
                      )}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </div>

              {/* Icon notifikasi & cart */}
              {isUserPending ? (
                <>
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="size-8 rounded-lg" />
                </>
              ) : (
                <>
                  {withCartBadge && <CartSheet />}
                  {withNotificationBadge && (
                    <>
                      {isAuthenticated ? (
                        <Link href="/notifications">
                          <Button variant="ghost" size="icon-sm">
                            <div className="relative flex items-center justify-center">
                              <IconBellFilled className="text-primary size-7" />
                              <div className="bg-badge absolute top-1 right-1 size-2 rounded-full"></div>
                            </div>
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="ghost" size="icon-sm" onClick={openAuthModal}>
                          <div className="relative flex items-center justify-center">
                            <IconBellFilled className="text-primary size-7" />
                            <div className="bg-badge absolute top-1 right-1 size-2 rounded-full"></div>
                          </div>
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </header>
    </>
  );
};

export default MainHeader;
