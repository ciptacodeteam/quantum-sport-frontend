'use client';

import BanCustomerAccess from '@/components/admin/customers/BanCustomerAccess';
import EditCustomerForm from '@/components/admin/customers/EditCustomerForm';
import ResetCustomerPassword from '@/components/admin/customers/ResetCustomerPassword';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { Separator } from '@/components/ui/separator';
import { adminCustomerQueryOptions } from '@/queries/admin/customer';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { type IdParams } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { Badge } from '@/components/ui/badge';
import PreviewImage from '@/components/ui/preview-image';
import { getNameInitial, formatPhone } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dayjs from 'dayjs';
import { ROLE } from '@/lib/constants';

const EditCustomerPage = ({ params }: { params: Promise<IdParams> }) => {
  const param = use(params);
  const { data: me } = useQuery(adminProfileQueryOptions);
  const { data: customer } = useQuery(adminCustomerQueryOptions(param.id));
  const isCashier = me?.role?.toUpperCase?.() === ROLE.CASHIER;

  if (isCashier) {
    // View-only mode for CASHIER
    return (
      <main>
        <Section>
          <SectionHeader>
            <SectionTitle title="Detail Kustomer" />
            <SectionDescription description="Informasi detail kustomer." />
          </SectionHeader>
          <SectionContent className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Kustomer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="flex items-center gap-4">
                  <PreviewImage
                    src={customer?.image}
                    className="aspect-square size-24 rounded-lg object-cover"
                    placeholder={getNameInitial(customer?.name || 'C')}
                  />
                  <div>
                    <p className="text-lg font-semibold">{customer?.name}</p>
                    <Badge variant={customer?.banned ? 'destructive' : 'success'}>
                      {customer?.banned ? 'Diblokir' : 'Aktif'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Customer Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-sm">Email</p>
                    <p className="font-medium">{customer?.email || '-'}</p>
                    <Badge
                      variant={customer?.emailVerified ? 'success' : 'secondary'}
                      className="mt-1"
                    >
                      {customer?.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Telepon</p>
                    <p className="font-medium">{formatPhone(customer?.phone || '') || '-'}</p>
                    <Badge
                      variant={customer?.phoneVerified ? 'success' : 'secondary'}
                      className="mt-1"
                    >
                      {customer?.phoneVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Tanggal Bergabung</p>
                    <p className="font-medium">
                      {customer?.createdAt ? dayjs(customer.createdAt).format('DD MMMM YYYY') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Terakhir Diperbarui</p>
                    <p className="font-medium">
                      {customer?.updatedAt ? dayjs(customer.updatedAt).format('DD MMMM YYYY') : '-'}
                    </p>
                  </div>
                </div>

                {customer?.banned && customer?.banReason && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-sm">Alasan Pemblokiran</p>
                      <p className="text-destructive font-medium">{customer.banReason}</p>
                      {customer.banExpires && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          Berakhir: {dayjs(customer.banExpires).format('DD MMMM YYYY')}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </SectionContent>
        </Section>
      </main>
    );
  }

  // Full edit mode for ADMIN
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Edit Kustomer" />
          <SectionDescription description="Perbarui informasi kustomer Anda di sini." />
        </SectionHeader>
        <SectionContent className="mt-4 grid grid-cols-1 justify-center xl:grid-cols-2 xl:gap-x-6">
          <div className="md:max-w-3xl">
            <EditCustomerForm customerId={param.id} />
          </div>
          <Separator className="mt-10 mb-6 block xl:hidden" />
          <div>
            <ResetCustomerPassword customerId={param.id} />
            <Separator className="my-4" />
            <BanCustomerAccess customerId={param.id} />
          </div>
        </SectionContent>
      </Section>
    </main>
  );
};
export default EditCustomerPage;
