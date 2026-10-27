'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import CustomerSettingsCard from './CustomerSettingsCard';
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
      invalidate: [
        adminCustomerQueryOptions(customerId).queryKey,
        adminCustomersQueryOptions.queryKey
      ]
    }
  );

  return (
    <CustomerSettingsCard
      title="WhatsApp"
      description="Verifikasi nomor kustomer setelah memastikan nomor tersebut benar."
    >
      <Alert variant={customer?.phoneVerified ? 'success' : 'info'} className="text-sm">
        <IconInfoCircle />
        <AlertDescription>
          {customer?.phoneVerified
            ? 'Nomor WhatsApp kustomer ini sudah terverifikasi.'
            : 'Jika OTP tidak masuk, admin dapat memverifikasi nomor ini secara manual setelah memastikan nomor benar.'}
        </AlertDescription>
      </Alert>

      <Button
        variant="outline"
        size="sm"
        className="rounded-lg shadow-none"
        disabled={!customer?.phone || customer?.phoneVerified}
        onClick={() => confirmAndMutate(customerId)}
      >
        {customer?.phoneVerified ? 'Sudah terverifikasi' : 'Verifikasi nomor'}
      </Button>
    </CustomerSettingsCard>
  );
};

export default VerifyCustomerWhatsApp;
