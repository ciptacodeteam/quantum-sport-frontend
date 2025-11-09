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
        <SectionTitle title="Hapus Akses Kustomer" />
        <SectionDescription description="Hapus akses kustomer ini ke platform kami." />
      </SectionHeader>
      <SectionContent>
        <Alert variant="info" className="mb-4">
          <IconInfoCircle />
          <AlertDescription>
            Fitur ini akan mengirimkan link kepada kustomer untuk mereset kata sandi mereka.
          </AlertDescription>
        </Alert>

        <Button
          variant="secondarySuccess"
          className="mt-6 md:mt-0"
          onClick={() => sendResetPasswordLinkMutate(customerId)}
          loading={isPending}
        >
          Unban Akses Kustomer
        </Button>
      </SectionContent>
    </Section>
  );
};
export default ResetCustomerPassword;
