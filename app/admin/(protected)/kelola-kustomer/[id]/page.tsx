'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { IconArrowLeft } from '@tabler/icons-react';
import BanCustomerAccess from '@/components/admin/customers/BanCustomerAccess';
import CustomerSettingsCard from '@/components/admin/customers/CustomerSettingsCard';
import EditCustomerForm from '@/components/admin/customers/EditCustomerForm';
import ResetCustomerPassword from '@/components/admin/customers/ResetCustomerPassword';
import VerifyCustomerWhatsApp from '@/components/admin/customers/VerifyCustomerWhatsApp';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { adminCustomerQueryOptions } from '@/queries/admin/customer';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { formatPhone, getNameInitial } from '@/lib/utils';
import { formatBookingDate } from '@/lib/booking-display';
import { ROLE } from '@/lib/constants';
import type { IdParams } from '@/types';

export default function EditCustomerPage({ params }: { params: Promise<IdParams> }) {
  const { id } = use(params);
  const profile = useQuery(adminProfileQueryOptions);
  const query = useQuery(adminCustomerQueryOptions(id));
  const customer = query.data;
  const role = profile.data?.role?.toUpperCase();
  const canEdit = [ROLE.ADMIN, ROLE.SUPER_ADMIN, ROLE.CASHIER].some((value) => value === role);
  const canManage = role === ROLE.ADMIN || role === ROLE.SUPER_ADMIN;
  return (
    <main className="w-full min-w-0">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground mb-4 -ml-2 gap-2">
        <Link href="/admin/kelola-kustomer">
          <IconArrowLeft className="size-4" />
          Daftar kustomer
        </Link>
      </Button>
      <Section>
        <SectionHeader>
          <SectionTitle title={canEdit ? 'Edit Kustomer' : 'Detail Kustomer'} />
          <SectionDescription description="Informasi profil dan pengaturan akun kustomer." />
        </SectionHeader>
        <SectionContent>
          {query.isPending || profile.isPending ? (
            <p role="status" className="text-muted-foreground py-8 text-sm">
              Memuat data kustomer...
            </p>
          ) : query.isError || !customer ? (
            <div role="alert" className="space-y-3 rounded-xl border p-6">
              <p className="text-muted-foreground text-sm">Data kustomer belum dapat dimuat.</p>
              <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-11 shrink-0 rounded-xl">
                    <AvatarImage src={customer.image || undefined} alt="" />
                    <AvatarFallback className="bg-muted text-muted-foreground rounded-xl text-sm font-medium">
                      {getNameInitial(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold break-words">{customer.name}</p>
                    {customer.email && (
                      <p className="text-muted-foreground text-xs break-all">{customer.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    Bergabung {formatBookingDate(customer.createdAt, 'DD MMM YYYY')}
                  </span>
                  <Badge variant={customer.banned ? 'lightDestructive' : 'lightSuccess'}>
                    {customer.banned ? 'Diblokir' : 'Aktif'}
                  </Badge>
                </div>
              </div>
              <div className="grid items-start gap-5 lg:grid-cols-2">
                <CustomerSettingsCard
                  title="Informasi kustomer"
                  description={
                    canEdit
                      ? 'Perbarui nama dan nomor telepon kustomer.'
                      : 'Detail kontak dan informasi akun kustomer.'
                  }
                >
                  {canEdit ? (
                    <EditCustomerForm customerId={id} />
                  ) : (
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="space-y-1">
                        <dt className="text-muted-foreground text-xs">Nama lengkap</dt>
                        <dd className="font-medium break-words">{customer.name}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-muted-foreground text-xs">Telepon</dt>
                        <dd>{customer.phone ? formatPhone(customer.phone) : '—'}</dd>
                      </div>
                      <div className="min-w-0 space-y-1 sm:col-span-2">
                        <dt className="text-muted-foreground text-xs">Email</dt>
                        <dd className="break-all">{customer.email || '—'}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-muted-foreground text-xs">WhatsApp</dt>
                        <dd>{customer.phoneVerified ? 'Terverifikasi' : 'Belum terverifikasi'}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-muted-foreground text-xs">Diperbarui</dt>
                        <dd>{formatBookingDate(customer.updatedAt, 'DD MMM YYYY')}</dd>
                      </div>
                      {customer.banned && customer.banReason && (
                        <div className="space-y-1 sm:col-span-2">
                          <dt className="text-muted-foreground text-xs">Alasan pemblokiran</dt>
                          <dd className="text-destructive break-words">{customer.banReason}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </CustomerSettingsCard>
                {canEdit && (
                  <div className="min-w-0 space-y-5">
                    <VerifyCustomerWhatsApp customerId={id} />
                    <ResetCustomerPassword customerId={id} />
                    {canManage && <BanCustomerAccess customerId={id} />}
                  </div>
                )}
              </div>
            </div>
          )}
        </SectionContent>
      </Section>
    </main>
  );
}
