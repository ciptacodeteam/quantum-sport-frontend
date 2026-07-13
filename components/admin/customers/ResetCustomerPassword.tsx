'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/clipboard-copy';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
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
    <Section>
      <SectionHeader>
        <SectionTitle title="Reset Password Kustomer" />
        <SectionDescription description="Buat link untuk mereset kata sandi kustomer ini." />
      </SectionHeader>
      <SectionContent>
        <Alert variant="info" className="mb-4">
          <IconInfoCircle />
          <AlertDescription>
            Fitur ini akan membuat link reset password. Jika email/WhatsApp tidak terkirim, salin
            link dan kirim manual ke kustomer.
          </AlertDescription>
        </Alert>

        {resetLink && (
          <div className="border-border bg-muted/30 mb-4 rounded-lg border p-3">
            <p className="text-muted-foreground mb-2 text-sm">Link reset password</p>
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{resetLink}</p>
              <CopyButton content={resetLink} variant="outline" />
            </div>
          </div>
        )}

        <Button
          variant="secondaryInfo"
          className="mt-6 md:mt-0"
          onClick={() => sendResetPasswordLinkMutate(customerId)}
          loading={isPending}
        >
          Buat Link Reset Password
        </Button>
      </SectionContent>
    </Section>
  );
};
export default ResetCustomerPassword;
