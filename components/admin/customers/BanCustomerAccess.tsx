'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ManagedDialog } from '@/components/ui/dialog-context';
import CustomerSettingsCard from './CustomerSettingsCard';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { adminCustomerQueryOptions, adminCustomersQueryOptions } from '@/queries/admin/customer';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import BanCustomerForm from './BanCustomerForm';
import { adminUnbanCustomerMutationOptions } from '@/mutations/admin/customer';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

interface Props {
  customerId: string;
}

const BanCustomerAccess = ({ customerId }: Props) => {
  const { data } = useQuery(adminCustomerQueryOptions(customerId));

  const router = useRouter();

  const { confirmAndMutate: unbanCustomerMutate } = useConfirmMutation(
    {
      mutationFn: adminUnbanCustomerMutationOptions().mutationFn
    },
    {
      title: 'Unban Kustomer',
      description: 'Apakah Anda yakin ingin membuka kembali akses kustomer ini?',
      confirmText: 'Unban',
      cancelText: 'Batal',
      destructive: false,
      toastMessages: {
        loading: 'Membuka kembali akses kustomer...',
        success: () => 'Data berhasil dibuka kembali.',
        error: 'Gagal membuka kembali akses kustomer.'
      },
      invalidate: [
        adminCustomersQueryOptions.queryKey,
        adminCustomerQueryOptions(customerId).queryKey
      ],
      router: {
        invalidate: router.refresh
      }
    }
  );

  return (
    <CustomerSettingsCard
      title="Akses akun"
      description="Kelola pemblokiran akses kustomer ke platform."
      danger
    >
      <Alert variant="warning" className="text-sm">
        <IconInfoCircle />
        <AlertDescription>
          Pemblokiran membatasi akses masuk kustomer. Akses dapat dibuka kembali melalui halaman
          ini.
        </AlertDescription>
      </Alert>

      {data?.banned && (
        <Alert variant="warning" className="mb-5">
          <AlertDescription>
            Kustomer ini diban hingga{' '}
            {data.banExpires
              ? dayjs(data.banExpires).format('DD MMMM YYYY HH:mm')
              : 'waktu yang tidak ditentukan'}
            . <br />
            Alasan: {data.banReason}
          </AlertDescription>
        </Alert>
      )}
      {data?.banned ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg shadow-none"
          onClick={() => unbanCustomerMutate(customerId)}
        >
          Buka blokir akun
        </Button>
      ) : (
        <ManagedDialog id="ban-customer-dialog">
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" className="rounded-lg shadow-none">
              Blokir akun
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl p-5 sm:max-w-lg">
            <DialogHeader className="text-sm">
              <DialogTitle className="text-foreground text-lg">Blokir akun</DialogTitle>
            </DialogHeader>
            <BanCustomerForm customerId={customerId} />
          </DialogContent>
        </ManagedDialog>
      )}
    </CustomerSettingsCard>
  );
};
export default BanCustomerAccess;
