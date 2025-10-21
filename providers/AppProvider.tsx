'use client';

import { PropsWithChildren } from 'react';
import ReactQueryProvider from './ReactQueryProvider';
import { Toaster } from '@/components/ui/sonner';

import dayjs from 'dayjs';
import localeId from 'dayjs/locale/id';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale(localeId);
dayjs.tz.setDefault('Asia/Jakarta');

const AppProvider = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <>
      <ReactQueryProvider>
        {children}
        <Toaster position="top-center" richColors />
      </ReactQueryProvider>
    </>
  );
};
export default AppProvider;
