'use client';

import { Suspense, type PropsWithChildren } from 'react';
import ReactQueryProvider from './ReactQueryProvider';

import { DialogProvider } from '@/components/ui/dialog-context';
import '@/lib/dayjs';
import { Toaster } from 'sonner';
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog';
import AuthModal from '@/components/modals/AuthModal';
import { usePathname } from 'next/navigation';

const AppProvider = ({ children }: Readonly<PropsWithChildren>) => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      <ReactQueryProvider>
        <DialogProvider>
          <ConfirmDialogProvider>
            {children}
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
