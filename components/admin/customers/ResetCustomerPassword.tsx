'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/clipboard-copy';
import CustomerSettingsCard from './CustomerSettingsCard';
import { adminSendCustomerResetPasswordMutationOptions } from '@/mutations/admin/customer';
import { IconInfoCircle } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

type Props = {
  customerId: string;
};

const ResetCustomerPassword = ({ customerId }: Props) => {
  const [resetLink, setResetLink] = useState('');
  const { mutate, isPending } = useMutation(
    adminSendCustomerResetPasswordMutationOptions({
      onSuccess: (res) => {
        setResetLink(res?.data?.resetLink || '');
      }
    })
  );

  const sendResetPasswordLinkMutate = (id: string) => {
    mutate(id);
  };

  return (
    <CustomerSettingsCard
      title="Reset kata sandi"
      description="Buat tautan untuk membantu kustomer mengatur ulang kata sandi."
    >
      <Alert variant="info" className="text-sm">
        <IconInfoCircle />
        <AlertDescription>
          Tautan reset dapat disalin dan diberikan kepada kustomer jika pesan tidak diterima.
        </AlertDescription>
      </Alert>

      {resetLink && (
        <div className="border-border bg-muted/30 mb-4 rounded-lg border p-3">
          <p className="text-muted-foreground mb-2 text-sm">Tautan reset kata sandi</p>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{resetLink}</p>
            <CopyButton content={resetLink} variant="outline" />
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="rounded-lg shadow-none"
        onClick={() => sendResetPasswordLinkMutate(customerId)}
        loading={isPending}
      >
        Buat tautan reset
      </Button>
    </CustomerSettingsCard>
  );
};
export default ResetCustomerPassword;
