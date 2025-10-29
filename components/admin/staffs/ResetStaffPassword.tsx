'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupClipboardButton } from '@/components/ui/input-group';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { maskText } from '@/lib/utils';
import { adminResetStaffPasswordMutationOptions } from '@/mutations/admin/staff';
import { adminStaffQueryOptions } from '@/queries/admin/staff';
import { IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';

type Props = {
  staffId: string;
};

const ResetStaffPassword = ({ staffId }: Props) => {
  const [openViewPasswordDialog, setOpenViewPasswordDialog] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: adminResetStaffPasswordMutationOptions().mutationFn,
      onSuccess: (res) => {
        const generatedPassword = res.data.generatedPassword;
        if (generatedPassword) {
          setOpenViewPasswordDialog(true);
          setGeneratedPassword(generatedPassword);
        }
      }
    },
    {
      title: 'Reset Password',
      description: 'Apakah anda yakin ingin mereset password untuk karyawan ini? ',
      confirmText: 'Reset',
      cancelText: 'Batal',
      destructive: true,
      invalidate: adminStaffQueryOptions(staffId).queryKey,
      toastMessages: {
        success: 'Password karyawan telah direset.',
        error: 'Gagal mereset password karyawan.'
      }
    }
  );

  const onResetPassword = () => {
    confirmAndMutate(staffId);
  };

  return (
    <>
      <Dialog open={openViewPasswordDialog} onOpenChange={setOpenViewPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Baru Karyawan</DialogTitle>
            <DialogDescription>Berikut adalah password baru untuk karyawan.</DialogDescription>
          </DialogHeader>
          <Section>
            <SectionContent>
              <Alert variant="info" className="mb-4">
                <IconInfoCircle />
                <AlertDescription>
                  Salin password baru ini dan berikan kepada karyawan. Pastikan untuk menyimpannya
                  dengan aman karena password ini tidak dapat diakses kembali.
                </AlertDescription>
              </Alert>
              <InputGroup>
                <Input type="text" readOnly value={maskText(generatedPassword)} />
                <InputGroupClipboardButton content={generatedPassword} />
              </InputGroup>
            </SectionContent>
          </Section>
          <DialogFooter>
            <Button variant={'outline'} onClick={() => setOpenViewPasswordDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Section>
        <SectionHeader>
          <SectionTitle title="Reset Password Karyawan" />
          <SectionDescription description="Kirim tautan reset password ke email karyawan ini." />
        </SectionHeader>
        <SectionContent>
          <Alert variant="info" className="mb-4">
            <IconInfoCircle />
            <AlertDescription>
              Dengan mengklik tombol di bawah, anda akan generate password baru untuk karyawan ini.
            </AlertDescription>
          </Alert>
          <Button variant="secondaryInfo" className="mt-6 md:mt-0" onClick={onResetPassword}>
            Reset Password
          </Button>
        </SectionContent>
      </Section>
    </>
  );
};
export default ResetStaffPassword;
