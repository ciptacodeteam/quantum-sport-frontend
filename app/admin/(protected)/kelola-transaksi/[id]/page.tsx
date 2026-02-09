'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { adminInvoiceQueryOptions } from '@/queries/admin/invoice';
import { formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isPending, isError } = useQuery(adminInvoiceQueryOptions(id));

  if (isError) notFound();

  const invoice = data as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Detail Transaksi</h1>
        <p className="text-muted-foreground">No. {invoice?.number ?? '-'}</p>
      </div>

      {isPending ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge>{invoice?.status}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Tipe</p>
                  <p className="font-medium">{invoice?.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Diterbitkan</p>
                  <p className="font-medium">
                    {invoice?.issuedAt ? dayjs(invoice.issuedAt).format('DD/MM/YYYY HH:mm') : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Jatuh Tempo</p>
                  <p className="font-medium">
                    {invoice?.dueDate ? dayjs(invoice.dueDate).format('DD/MM/YYYY HH:mm') : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Dibayar</p>
                  <p className="font-medium">
                    {invoice?.paidAt ? dayjs(invoice.paidAt).format('DD/MM/YYYY HH:mm') : '-'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground text-sm">Subtotal</span>
                  <span className="font-medium">Rp {formatNumber(invoice?.subtotal || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground text-sm">Biaya Proses</span>
                  <span className="font-medium">
                    Rp {formatNumber(invoice?.processingFee || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-semibold">
                    Rp {formatNumber(invoice?.total || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kustomer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-muted size-10 overflow-hidden rounded-full" />
                <div>
                  <p className="font-medium">{invoice?.user?.name}</p>
                  <p className="text-muted-foreground text-sm">{invoice?.user?.email}</p>
                </div>
              </div>
              {invoice?.user?.phone && (
                <p className="text-muted-foreground text-sm">{invoice.user.phone}</p>
              )}
            </CardContent>
          </Card>

          {invoice?.booking && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Detail Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <p className="font-medium">{invoice.booking.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Harga</p>
                    <p className="font-medium">
                      Rp{' '}
                      {formatNumber(
                        (invoice.booking.courtDiscountPrice ?? invoice.booking.totalPrice) || 0
                      )}
                    </p>
                  </div>
                </div>

                {Array.isArray(invoice.booking.courts) && invoice.booking.courts.length > 0 && (
                  <div>
                    <p className="mb-2 font-semibold">Lapangan</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {invoice.booking.courts.map((item: any, idx: number) => (
                        <div key={idx} className="rounded-md border p-3">
                          <p className="font-medium">{item.court?.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {dayjs(item.slot?.startAt).format('DD/MM/YYYY HH:mm')} -{' '}
                            {dayjs(item.slot?.endAt).format('HH:mm')}
                          </p>
                          {(() => {
                            const normalPrice = item.price || item.slot?.price || 0;
                            const discountPrice =
                              item.discountPrice ?? item.slot?.discountPrice ?? 0;
                            if (discountPrice > 0 && discountPrice < normalPrice) {
                              return (
                                <div className="text-sm">
                                  <span className="text-muted-foreground line-through">
                                    Rp {formatNumber(normalPrice)}
                                  </span>
                                  <span className="ml-2 text-green-700">
                                    Rp {formatNumber(discountPrice)}
                                  </span>
                                </div>
                              );
                            }
                            return <p className="text-sm">Rp {formatNumber(normalPrice)}</p>;
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(invoice.booking.coaches) && invoice.booking.coaches.length > 0 && (
                  <div>
                    <p className="mb-2 font-semibold">Coach</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {invoice.booking.coaches.map((item: any, idx: number) => (
                        <div key={idx} className="rounded-md border p-3">
                          <p className="font-medium">{item.staff?.name}</p>
                          <p className="text-muted-foreground text-sm">{item.coachType?.name}</p>
                          <p className="text-sm">
                            {dayjs(item.slot?.startAt).format('DD/MM/YYYY HH:mm')} -{' '}
                            {dayjs(item.slot?.endAt).format('HH:mm')}
                          </p>
                          <p className="text-sm">Rp {formatNumber(item.price || 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(invoice.booking.ballboys) && invoice.booking.ballboys.length > 0 && (
                  <div>
                    <p className="mb-2 font-semibold">Ballboy</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {invoice.booking.ballboys.map((item: any, idx: number) => (
                        <div key={idx} className="rounded-md border p-3">
                          <p className="font-medium">{item.staff?.name}</p>
                          <p className="text-sm">
                            {dayjs(item.slot?.startAt).format('DD/MM/YYYY HH:mm')} -{' '}
                            {dayjs(item.slot?.endAt).format('HH:mm')}
                          </p>
                          <p className="text-sm">Rp {formatNumber(item.price || 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(invoice.booking.inventories) &&
                  invoice.booking.inventories.length > 0 && (
                    <div>
                      <p className="mb-2 font-semibold">Inventori</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {invoice.booking.inventories.map((item: any, idx: number) => (
                          <div key={idx} className="rounded-md border p-3">
                            <p className="font-medium">{item.inventory?.name}</p>
                            <p className="text-sm">Qty: {item.quantity}</p>
                            <p className="text-sm">Rp {formatNumber(item.price || 0)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {invoice?.classBooking && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Detail Kelas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Nama Kelas</p>
                    <p className="font-medium">{invoice.classBooking.class?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <p className="font-medium">{invoice.classBooking.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Harga</p>
                    <p className="font-medium">
                      Rp {formatNumber(invoice.classBooking.totalPrice || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {invoice?.membership && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Detail Membership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Nama</p>
                    <p className="font-medium">{invoice.membership.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Durasi</p>
                    <p className="font-medium">{invoice.membership.duration} hari</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Sesi</p>
                    <p className="font-medium">{invoice.membership.sessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
