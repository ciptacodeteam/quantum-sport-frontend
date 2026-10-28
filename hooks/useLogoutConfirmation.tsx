'use client';

import { useConfirm } from '@/components/ui/confirm-dialog';
import { LogOut } from 'lucide-react';

export function useLogoutConfirmation() {
  const confirm = useConfirm();
  return () =>
    confirm({
      title: 'Keluar dari akun?',
      description: 'Anda perlu masuk kembali untuk mengakses akun Anda.',
      confirmText: 'Logout',
      cancelText: 'Batal',
      icon: <LogOut strokeWidth={1.5} aria-hidden="true" />
    });
}
