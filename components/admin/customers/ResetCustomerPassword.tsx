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
import { adminSendCustomerResetPasswordMutationOptions } from '@/mutations/admin/customer';
import { IconInfoCircle } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';

type Props = {
  customerId: string;
};

const ResetCustomerPassword = ({ customerId }: Props) => {
  const { mutate, isPending } = useMutation(adminSendCustomerResetPasswordMutationOptions());

  const sendResetPasswordLinkMutate = (id: string) => {
    mutate(id);
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle title="Reset Password Kustomer" />
        <SectionDescription description="Kirim link untuk mereset kata sandi kustomer ini." />
      </SectionHeader>
      <SectionContent>
        <Alert variant="info" className="mb-4">
          <IconInfoCircle />
          <AlertDescription>
            Fitur ini akan mengirimkan link kepada kustomer untuk mereset kata sandi mereka.
          </AlertDescription>
        </Alert>

        <Button
          variant="secondaryInfo"
          className="mt-6 md:mt-0"
          onClick={() => sendResetPasswordLinkMutate(customerId)}
          loading={isPending}
        >
          Kirim Link Reset Password
        </Button>
      </SectionContent>
    </Section>
  );
};
export default ResetCustomerPassword;
