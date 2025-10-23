'use client';

import type { PropsWithChildren } from 'react';
import ReactQueryProvider from './ReactQueryProvider';

import dayjs from 'dayjs';
import localeId from 'dayjs/locale/id';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Toaster } from 'sonner';

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
