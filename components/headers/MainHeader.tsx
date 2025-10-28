'use client';

import LogoImage from '@/aseets/img/logo.svg';
import { cn } from '@/lib/utils';
import { profileQueryOptions } from '@/queries/profile';
import { IconBell, IconShoppingCart } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import AuthModal from '../modals/AuthModal';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

const MainHeader = () => {
  const [openAuthModal, setOpenAuthModal] = useState(false);

  const { isPending: isUserPending } = useQuery(profileQueryOptions);

  return (
    <>
      <AuthModal open={openAuthModal} onOpenChange={setOpenAuthModal} />

      <header className={cn('flex-center top-0 right-0 left-0 z-40 min-h-20 w-full bg-white')}>
        <div className="mx-auto w-full max-w-7xl px-4">
          <main className="flex-between gap-4">
            <Link href="/" prefetch>
              <div className="flex-center relative my-2 h-16 w-28 md:w-32">
                <LogoImage className="absolute inset-0 h-full w-full object-contain" />
              </div>
            </Link>

            <div className="flex items-center justify-end gap-4">
              {isUserPending ? (
                <>
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="size-8 rounded-lg" />
                </>
              ) : (
                <>
                  <Button variant={'ghost'} size={'icon-sm'}>
                    <IconShoppingCart className="size-6" />
                  </Button>
                  <Button variant={'ghost'} size={'icon-sm'}>
                    <IconBell className="size-6" />
                  </Button>
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
