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
import { adminVerifyCustomerPhoneMutationOptions } from '@/mutations/admin/customer';
import { adminCustomerQueryOptions, adminCustomersQueryOptions } from '@/queries/admin/customer';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

type Props = {
  customerId: string;
};

const VerifyCustomerWhatsApp = ({ customerId }: Props) => {
  const { data: customer } = useQuery(adminCustomerQueryOptions(customerId));

  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: adminVerifyCustomerPhoneMutationOptions().mutationFn
    },
    {
      title: 'Verifikasi WhatsApp kustomer?',
      description:
        'Gunakan aksi ini hanya jika admin sudah memastikan nomor WhatsApp kustomer benar.',
      confirmText: 'Tandai Terverifikasi',
      cancelText: 'Batal',
      destructive: false,
      toastMessages: {
        loading: 'Memverifikasi nomor WhatsApp...',
        success: 'Nomor WhatsApp berhasil diverifikasi.',
        error: 'Gagal memverifikasi nomor WhatsApp.'
      },
      invalidate: [adminCustomerQueryOptions(customerId).queryKey, adminCustomersQueryOptions.queryKey]
    }
  );

  return (
    <Section>
      <SectionHeader>
        <SectionTitle title="Verifikasi WhatsApp Kustomer" />
        <SectionDescription description="Tandai nomor WhatsApp kustomer sebagai terverifikasi." />
      </SectionHeader>
      <SectionContent>
        <Alert variant={customer?.phoneVerified ? 'success' : 'info'} className="mb-4">
          <IconInfoCircle />
          <AlertDescription>
            {customer?.phoneVerified
              ? 'Nomor WhatsApp kustomer ini sudah terverifikasi.'
              : 'Jika OTP tidak masuk, admin dapat memverifikasi nomor ini secara manual setelah memastikan nomor benar.'}
          </AlertDescription>
        </Alert>

        <Button
          variant="secondary"
          disabled={!customer?.phone || customer?.phoneVerified}
          onClick={() => confirmAndMutate(customerId)}
        >
          Tandai WhatsApp Terverifikasi
        </Button>
      </SectionContent>
    </Section>
  );
};

export default VerifyCustomerWhatsApp;
