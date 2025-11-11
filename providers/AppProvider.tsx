'use client';

import { Suspense, type PropsWithChildren } from 'react';
import ReactQueryProvider from './ReactQueryProvider';

import { DialogProvider } from '@/components/ui/dialog-context';
import dayjs from 'dayjs';
import localeId from 'dayjs/locale/id';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Toaster } from 'sonner';
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog';
import AuthModal from '@/components/modals/AuthModal';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale(localeId);
dayjs.tz.setDefault('Asia/Jakarta');

const AppProvider = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <>
      <ReactQueryProvider>
        <DialogProvider>
          <ConfirmDialogProvider>
            {children}
            <Suspense>
              <AuthModal />
            </Suspense>
            <Toaster position="top-center" richColors />
          </ConfirmDialogProvider>
        </DialogProvider>
      </ReactQueryProvider>
    </>
  );
};
export default AppProvider;
