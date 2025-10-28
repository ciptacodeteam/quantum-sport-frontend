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
import { Badge } from '../ui/badge';
import { ChevronLeft } from 'lucide-react';

type Props = {
  onBack?: () => void;
  backHref?: string;
};

const MainHeader = ({ onBack, backHref }: Props) => {
  const [openAuthModal, setOpenAuthModal] = useState(false);

  const { isPending: isUserPending } = useQuery(profileQueryOptions);

  return (
    <>
      <AuthModal open={openAuthModal} onOpenChange={setOpenAuthModal} />

      <header className={cn('flex-center top-0 right-0 left-0 z-40 min-h-20 w-full bg-white')}>
        <div className="mx-auto w-full max-w-7xl px-4">
          <main className="flex-between gap-4">
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
                    <div className="flex-center relative">
                      <IconShoppingCart className="size-6" />
                      <Badge className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
                        3
                      </Badge>
                    </div>
                  </Button>
                  <Button variant={'ghost'} size={'icon-sm'}>
                    <div className="flex-center relative">
                      <IconBell className="size-6" />
                      <Badge className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
                        3
                      </Badge>
                    </div>
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
