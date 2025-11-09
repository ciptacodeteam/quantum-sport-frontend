'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ManagedDialog } from '@/components/ui/dialog-context';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
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
      invalidate: adminCustomersQueryOptions.queryKey,
      router: {
        invalidate: router.refresh
      }
    }
  );

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
            Dengan mengklik tombol di bawah, anda akan menghapus akses kustomer ini ke platform kami
            secara permanen.
          </AlertDescription>
        </Alert>

        {data?.banned && !dayjs(data.banExpires).isAfter(dayjs()) && (
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
            variant="secondarySuccess"
            className="mt-6 md:mt-0"
            onClick={() => unbanCustomerMutate(customerId)}
          >
            Unban Akses Kustomer
          </Button>
        ) : (
          <ManagedDialog id="ban-customer-dialog">
            <DialogTrigger asChild>
              <Button variant="destructive" className="mt-6 md:mt-0">
                Ban Akses Kustomer
              </Button>
            </DialogTrigger>
            <DialogContent className="lg:min-w-xl">
              <DialogHeader className="mb-4">
                <DialogTitle>Ban Akses Kustomer</DialogTitle>
              </DialogHeader>
              <BanCustomerForm customerId={customerId} />
            </DialogContent>
          </ManagedDialog>
        )}
      </SectionContent>
    </Section>
  );
};
export default BanCustomerAccess;
