'use client';

import LogoImage from '@/assets/img/logo.svg';
import { cn } from '@/lib/utils';
import { profileQueryOptions } from '@/queries/profile';
import { IconBellFilled } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import CartSheet from '../CartSheet';
import AuthModal from '../modals/AuthModal';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { usePathname } from 'next/navigation';

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
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const pathname = usePathname();

  const isBeranda = pathname === '/';
  const isAuthenticated = !!user?.id;

  const navItems = [
    { title: 'Beranda', path: '/' },
    { title: 'Pemesanan', path: '/activities' },
    { title: 'Riwayat', path: '/sports' },
    { title: 'Profil', path: '/profile', requiresAuth: true },
  ];

  return (
    <>
      <AuthModal open={openAuthModal} onOpenChange={setOpenAuthModal} />

      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-40 border-b bg-white',
        )}
      >
        <div className="mx-auto w-11/12 lg:max-w-7xl lg:px-4 px-2 py-2">
          <main
            className={cn(
              'flex items-center min-h-[72px] gap-4',
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
                {title && <h1 className="text-xl text-primary font-semibold">{title}</h1>}
              </div>
            )}

            {/* Tengah: Logo */}
            {withLogo && (
              <Link href="/" prefetch>
                <div className="flex items-center justify-center h-16 w-28 relative">
                  <LogoImage className="absolute inset-0 h-full w-full object-contain" />
                </div>
              </Link>
            )}

            {/* Kanan: Navigasi + Notifikasi */}
            <div className="flex items-center justify-end gap-6 ml-auto">
              {/* Menu navigasi (desktop only) */}
              <div className="hidden lg:flex items-center gap-8">
                {navItems.map((item) => {
                  const requiresAuth = item.requiresAuth ?? false;
                  
                  if (requiresAuth && !isAuthenticated) {
                    return (
                      <button
                        key={item.path}
                        onClick={() => setOpenAuthModal(true)}
                        className={cn(
                          'text-gray-600 hover:text-primary transition-colors',
                          pathname === item.path && 'text-primary font-medium'
                        )}
                      >
                        {item.title}
                      </button>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={cn(
                        'text-gray-600 hover:text-primary transition-colors',
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
                    <Link href="/notifications">
                      <Button variant="ghost" size="icon-sm">
                        <div className="flex items-center justify-center relative">
                          <IconBellFilled className="text-primary size-7" />
                          <div className="bg-badge absolute top-1 right-1 size-2 rounded-full"></div>
                        </div>
                      </Button>
                    </Link>
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
