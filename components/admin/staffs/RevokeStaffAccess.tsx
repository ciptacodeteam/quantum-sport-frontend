'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import StaffSettingsCard from './StaffSettingsCard';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { adminRevokeStaffSessionMutationOptions } from '@/mutations/admin/staff';
import { adminStaffQueryOptions } from '@/queries/admin/staff';
import { IconInfoCircle } from '@tabler/icons-react';

type Props = {
  staffId: string;
};

const RevokeStaffAccess = ({ staffId }: Props) => {
  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: adminRevokeStaffSessionMutationOptions().mutationFn
    },
    {
      title: 'Revoke Sessions',
      description: 'Apakah anda yakin ingin mencabut sesi aktif untuk karyawan ini? ',
      confirmText: 'Revoke',
      cancelText: 'Batal',
      destructive: true,
      invalidate: adminStaffQueryOptions(staffId).queryKey,
      toastMessages: {
        success: 'Sesi aktif karyawan telah dicabut.',
        error: 'Gagal mencabut sesi aktif karyawan.'
      }
    }
  );

  const onRevoke = () => {
    confirmAndMutate(staffId);
  };

  return (
    <StaffSettingsCard title="Sesi login" description="Keluarkan karyawan dari semua perangkat.">
      <Alert variant="warning" className="mb-4">
        <IconInfoCircle />
        <AlertDescription>
          Dengan mengklik tombol di bawah, anda akan mencabut sesi aktif untuk karyawan ini.
          Karyawan yang bersangkutan akan diminta untuk login kembali pada semua perangkat.
        </AlertDescription>
      </Alert>
      <Button variant="outline" size="sm" className="rounded-lg shadow-none" onClick={onRevoke}>
        Keluar dari semua perangkat
      </Button>
    </StaffSettingsCard>
  );
};
export default RevokeStaffAccess;
