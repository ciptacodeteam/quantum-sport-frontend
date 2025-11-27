'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import MainHeader from '@/components/headers/MainHeader';
import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import { invoicesQueryOptions } from '@/queries/invoice';
import { profileQueryOptions } from '@/queries/profile';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Calendar, ChevronRight, CreditCard, FileText, Receipt, Crown, Clock } from 'lucide-react';
import type { Invoice } from '@/types/model';
import useAuthModalStore from '@/stores/useAuthModalStore';

dayjs.locale('id');
dayjs.extend(relativeTime);

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});

const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    HOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PAID: 'bg-green-100 text-green-800 border-green-200',
    CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
    EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    HOLD: 'Menunggu Pembayaran',
    PENDING: 'Menunggu Pembayaran',
    PAID: 'Lunas',
    CONFIRMED: 'Terkonfirmasi',
    FAILED: 'Gagal',
    CANCELLED: 'Dibatalkan',
    EXPIRED: 'Kadaluarsa'
  };
  return labels[status] || status;
};

export default function InvoiceHistoryPage() {
  const router = useRouter();
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const isAuthenticated = !!user?.id;
  const openAuthModal = useAuthModalStore((state) => state.open);

  const {
    data: response,
    isPending,
    isError
  } = useQuery(invoicesQueryOptions({ sort: 'createdAt', order: 'desc' }));

  // Invoices data + filter hooks (placed before any early returns)
  const invoices = useMemo(() => (response?.data as Invoice[]) ?? [], [response]);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MEMBERSHIP' | 'BOOKING'>('ALL');
  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [] as Invoice[];
    if (typeFilter === 'MEMBERSHIP') return invoices.filter((inv) => !!inv.membershipUser);
    if (typeFilter === 'BOOKING') return invoices.filter((inv) => !!inv.booking);
    return invoices;
  }, [invoices, typeFilter]);

  // Show login if not authenticated
  if (!isUserPending && !isAuthenticated) {
    return (
      <div className="mt-24 min-h-screen">
        <MainHeader />
        <div className="container mx-auto px-4 py-8 pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <Card>
              <CardContent className="pt-6 pb-8">
                <Receipt className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h2 className="mb-2 text-2xl font-bold">Login Diperlukan</h2>
                <p className="mb-6 text-gray-600">
                  Silakan login untuk melihat riwayat invoice Anda
                </p>
                <Button onClick={openAuthModal} size="lg">
                  Login Sekarang
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <MainBottomNavigation />
      </div>
    );
  }

  // invoices and filters already defined above

  if (isPending || isUserPending) {
    return (
      <div className="min-h-screen">
        <MainHeader />
        <div className="container mx-auto mt-28 px-4 pb-24 lg:mt-28">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <h1 className="mb-2 text-lg font-bold lg:text-3xl">Riwayat Invoice</h1>
              <p className="text-sm text-gray-600">
                Lihat semua riwayat pembayaran dan invoice Anda
              </p>
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="mb-3 h-6 w-1/3 rounded bg-gray-200"></div>
                    <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
                    <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <MainBottomNavigation />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen">
        <MainHeader />
        <div className="container mx-auto mt-28 px-4 pb-24 lg:mt-28">
          <div className="mx-auto max-w-2xl text-center">
            <Card>
              <CardContent className="pt-6">
                <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h2 className="mb-2 text-2xl font-bold">Gagal Memuat Data</h2>
                <p className="mb-6 text-gray-600">Terjadi kesalahan saat memuat riwayat invoice</p>
                <Button onClick={() => router.push('/')}>Kembali ke Beranda</Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <MainBottomNavigation />
      </div>
    );
  }

  return (
    <div>
      <MainHeader title="Riwayat Pemesanan" withLogo={false} withBorder />

      <div className="mx-auto mt-24 pb-32 lg:mt-28">
        <div className="mx-auto w-11/12 max-w-7xl">
          {/* Filters */}
          {invoices.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Button
                size="sm"
                variant={typeFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('ALL')}
              >
                Semua
              </Button>
              <Button
                size="sm"
                variant={typeFilter === 'MEMBERSHIP' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('MEMBERSHIP')}
              >
                Membership
              </Button>
              <Button
                size="sm"
                variant={typeFilter === 'BOOKING' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('BOOKING')}
              >
                Booking
              </Button>
            </div>
          )}
          {/* Empty State */}
          {invoices.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Receipt className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold">Belum Ada Invoice</h3>
                <p className="mb-6 text-gray-600">
                  Anda belum memiliki riwayat invoice. Mulai booking lapangan sekarang!
                </p>
                <Button onClick={() => router.push('/booking')}>Mulai Booking</Button>
              </CardContent>
            </Card>
          )}

          {/* Invoice List */}
          {invoices.length > 0 && (
            <div className="space-y-4">
              {filteredInvoices.length === 0 && (
                <Card>
                  <CardContent className="py-6 text-center text-sm text-gray-600">
                    Tidak ada invoice untuk filter ini.
                  </CardContent>
                </Card>
              )}
              {filteredInvoices.map((invoice) => {
                const booking = invoice.booking;
                const membershipUser = invoice.membershipUser;
                const membership = membershipUser?.membership;
                const isPending = invoice.status === 'PENDING' || booking?.status === 'HOLD';

                return (
                  <Card
                    key={invoice.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/invoice/${invoice.number}`)}
                  >
                    <CardContent className="p-4 py-2">
                      <header className="mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-gray-500" />
                              <span className="line-clamp-1 font-semibold text-gray-900">
                                {invoice.number}
                              </span>
                            </div>
                          </div>
                          <Badge
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          {membership ? (
                            <>
                              <Crown className="h-4 w-4 text-amber-500" />
                              <span className="font-medium text-amber-700">Membership</span>
                              <span className="text-gray-400">•</span>
                              <span className="truncate">{membership.name}</span>
                            </>
                          ) : booking ? (
                            <>
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">Booking Lapangan</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">Invoice</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs">
                            {dayjs(invoice.issuedAt).format('DD MMM YYYY, HH:mm')}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-xs">{dayjs(invoice.issuedAt).fromNow()}</span>
                        </div>
                      </header>

                      <Separator className="my-4" />

                      {/* Membership Purchase Preview */}
                      {membership && (
                        <div className="mb-4">
                          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                            <Crown className="h-4 w-4 text-amber-500" />
                            <span>Detail Membership</span>
                          </div>
                          <div className="rounded-md border p-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-semibold">{membership.name}</span>
                              <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                                {membership.sessions} sesi
                              </Badge>
                            </div>
                            <div className="mb-2 text-xs text-gray-600">
                              Durasi {membership.duration} hari
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  Berlaku: {dayjs(membershipUser?.startDate).format('DD MMM YYYY')}{' '}
                                  - {dayjs(membershipUser?.endDate).format('DD MMM YYYY')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Sisa sesi: {membershipUser?.remainingSessions || 0}</span>
                              </div>
                            </div>
                            {typeof membership.sessions === 'number' &&
                              typeof membershipUser?.remainingSessions === 'number' && (
                                <div className="mt-3">
                                  <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                                    <span>Progress Pemakaian</span>
                                    <span>
                                      {membership.sessions - membershipUser.remainingSessions}/
                                      {membership.sessions}
                                    </span>
                                  </div>
                                  <div className="h-2 w-full rounded-full bg-gray-200">
                                    <div
                                      className="h-2 rounded-full bg-amber-500"
                                      style={{
                                        width: `${Math.min(100, Math.max(0, ((membership.sessions - membershipUser.remainingSessions) / Math.max(1, membership.sessions)) * 100))}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Booking Details Preview */}
                      {booking && booking.details && booking.details.length > 0 && (
                        <div className="mb-4">
                          <div className="mb-2 text-sm text-gray-600">Pemesanan Lapangan:</div>
                          <div className="space-y-1">
                            {booking.details.slice(0, 2).map((detail: any, idx: number) => (
                              <div
                                key={detail.id || idx}
                                className="flex items-center gap-2 text-sm"
                              >
                                <div className="bg-primary h-2 w-2 rounded-full"></div>
                                <span className="font-medium">
                                  {detail.court?.name || detail.slot?.court?.name || 'Court'}
                                </span>
                                <span className="text-gray-600">
                                  - {dayjs(detail.slot?.startAt).format('DD MMM')}
                                </span>
                              </div>
                            ))}
                            {booking.details.length > 2 && (
                              <div className="ml-4 text-sm text-gray-500">
                                +{booking.details.length - 2} lapangan lainnya
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price and Action */}
                      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="mb-1 text-sm text-gray-600">Total Pembayaran</div>
                          <div className="text-primary text-lg font-bold">
                            {formatCurrency(invoice.total)}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          {isPending ? (
                            <Button
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/invoice/${invoice.number}`);
                              }}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Bayar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/invoice/${invoice.number}`);
                              }}
                            >
                              Lihat Detail
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Info Footer */}
          {invoices.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Menampilkan {filteredInvoices.length} invoice</p>
            </div>
          )}
        </div>
      </div>

      <MainBottomNavigation />
    </div>
  );
}
