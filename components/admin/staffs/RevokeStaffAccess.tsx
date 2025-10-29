'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
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
    <Section>
      <SectionHeader>
        <SectionTitle title="Revoke Sessions" />
        <SectionDescription description="Menghapus semua sesi aktif untuk karyawan ini." />
      </SectionHeader>
      <SectionContent>
        <Alert variant="warning" className="mb-4">
          <IconInfoCircle />
          <AlertDescription>
            Dengan mengklik tombol di bawah, anda akan mencabut sesi aktif untuk karyawan ini.
            Karyawan yang bersangkutan akan diminta untuk login kembali pada semua perangkat.
          </AlertDescription>
        </Alert>
        <Button variant="destructive" className="mt-6 md:mt-0" onClick={onRevoke}>
          Revoke Sessions
        </Button>
      </SectionContent>
    </Section>
  );
};
export default RevokeStaffAccess;
