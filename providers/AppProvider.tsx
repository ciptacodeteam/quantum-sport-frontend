'use client';

import BranchGate from '@/components/branches/BranchGate';
import { Suspense, type PropsWithChildren } from 'react';
import ReactQueryProvider from './ReactQueryProvider';

import { DialogProvider } from '@/components/ui/dialog-context';
import '@/lib/dayjs';
import { Toaster } from 'sonner';
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog';
import AuthModal from '@/components/modals/AuthModal';
import MainFooter from '@/components/footers/MainFooter';
import { usePathname } from 'next/navigation';

const AppProvider = ({ children }: Readonly<PropsWithChildren>) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      <ReactQueryProvider>
        <DialogProvider>
          <ConfirmDialogProvider>
            {isAdminRoute ? (
              children
            ) : (
              <div className="flex min-h-dvh flex-col">
                <BranchGate>
                  <div className="min-w-0 flex-1">{children}</div>
                  <MainFooter />
                </BranchGate>
              </div>
            )}
            {!isAdminRoute && (
              <Suspense>
                <AuthModal />
              </Suspense>
            )}
            <Toaster position="top-center" richColors />
          </ConfirmDialogProvider>
        </DialogProvider>
      </ReactQueryProvider>
    </>
  );
};
export default AppProvider;
