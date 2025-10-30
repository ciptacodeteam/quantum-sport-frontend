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

  const { isPending: isUserPending } = useQuery(profileQueryOptions);

  return (
    <>
      <AuthModal open={openAuthModal} onOpenChange={setOpenAuthModal} />

      <header
        className={cn(
          'flex-center fixed top-0 right-0 left-0 z-40 min-h-20 w-full border-b bg-white'
        )}
      >
        <div className="mx-auto w-full max-w-7xl px-4 pl-5">
          <main className="flex-between gap-4">
            {onBack || backHref || title ? (
              <div className="flex items-center gap-4">
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

                {title && <h1 className="text-lg font-semibold">{title}</h1>}
              </div>
            ) : null}
            {withLogo && (
              <Link href="/" prefetch>
                <div className="flex-center relative my-2 h-16 w-28 pl-2 md:w-32">
                  <LogoImage className="absolute inset-0 h-full w-full object-contain" />
                </div>
              </Link>
            )}

            <div className="flex items-center justify-end gap-4">
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
                      <Button variant={'ghost'} size={'icon-sm'}>
                        <div className="flex-center relative">
                          <IconBellFilled className="text-primary size-7" />
                          <div className="bg-badge absolute -top-0.5 right-0 size-3 rounded-full"></div>
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
