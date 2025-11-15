'use client';

import MainHeader from '@/components/headers/MainHeader';
import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookingStatus } from '@/lib/constants';
import { invoiceQueryOptions } from '@/queries/invoice';
import type { Booking, Invoice } from '@/types/model';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { ArrowLeft, Calendar, Clock, CreditCard, FileText, MapPin, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

dayjs.locale('id');

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

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceNumber = params.invoiceNumber as string;

  const { data: response, isPending, isError } = useQuery(invoiceQueryOptions(invoiceNumber));

  const invoice = response?.data as Invoice | undefined;
  const booking = invoice?.booking as Booking | undefined;

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <div className="container mx-auto px-4 py-8 pb-24">
          <div className="mx-auto max-w-4xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-1/3 rounded bg-gray-200"></div>
              <div className="h-64 rounded bg-gray-200"></div>
              <div className="h-48 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen">
        <MainHeader />
        <div className="container mx-auto mt-28 px-4 pb-24 lg:mt-28">
          <div className="mx-auto max-w-4xl text-center">
            <Card>
              <CardContent className="pt-6">
                <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h2 className="mb-2 text-2xl font-bold">Invoice Tidak Ditemukan</h2>
                <p className="mb-6 text-gray-600">
                  Invoice dengan nomor {invoiceNumber} tidak ditemukan.
                </p>
                <Button onClick={() => router.push('/')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const bookingDetails = booking?.details || [];
  const bookingInventories = (booking as any)?.bookingInventories || [];
  const bookingCoaches = (booking as any)?.bookingCoaches || [];
  const bookingBallboys = (booking as any)?.bookingBallboys || [];

  // Group booking details by date and court
  const groupedBookings = bookingDetails.reduce((acc: any, detail: any) => {
    const date = dayjs(detail.slot?.startAt).format('YYYY-MM-DD');
    const courtName = detail.court?.name || detail.slot?.court?.name || 'Unknown Court';

    if (!acc[date]) {
      acc[date] = {};
    }
    if (!acc[date][courtName]) {
      acc[date][courtName] = [];
    }
    acc[date][courtName].push(detail);
    return acc;
  }, {});

  const canPay = invoice.status === 'PENDING' || (booking && booking.status === BookingStatus.HOLD);
  const paymentUrl = (invoice as any).paymentUrl || (booking as any).paymentUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />

      <div className="container mx-auto mt-28 px-4 pb-24 lg:mt-28">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold">Invoice Detail</h1>
                <p className="text-gray-600">
                  Nomor Invoice: <span className="font-semibold">{invoice.number}</span>
                </p>
              </div>
              <Badge className={getStatusColor(invoice.status)} variant="outline">
                {getStatusLabel(invoice.status)}
              </Badge>
            </div>
          </div>

          {/* Invoice Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informasi Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Tanggal Pembuatan</p>
                  <p className="font-semibold">
                    {dayjs(invoice.issuedAt).format('DD MMMM YYYY, HH:mm')}
                  </p>
                </div>
                {invoice.dueAt && (
                  <div>
                    <p className="text-sm text-gray-600">Jatuh Tempo</p>
                    <p className="font-semibold">
                      {dayjs(invoice.dueAt).format('DD MMMM YYYY, HH:mm')}
                    </p>
                  </div>
                )}
                {invoice.paidAt && (
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Pembayaran</p>
                    <p className="font-semibold text-green-600">
                      {dayjs(invoice.paidAt).format('DD MMMM YYYY, HH:mm')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Status Booking</p>
                  <Badge className={getStatusColor(booking?.status || '')} variant="outline">
                    {getStatusLabel(booking?.status || '')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detail Pemesanan Lapangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedBookings).map(([date, courts]: [string, any]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Calendar className="text-primary h-5 w-5" />
                    {dayjs(date).format('dddd, DD MMMM YYYY')}
                  </div>

                  {Object.entries(courts).map(([courtName, details]: [string, any]) => (
                    <div key={courtName} className="ml-4 space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        {courtName}
                      </div>

                      <div className="ml-6 space-y-2">
                        {details.map((detail: any, idx: number) => (
                          <div
                            key={detail.id || idx}
                            className="flex items-center justify-between border-b py-2 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>
                                {dayjs(detail.slot?.startAt).format('HH:mm')} -{' '}
                                {dayjs(detail.slot?.endAt).format('HH:mm')}
                              </span>
                            </div>
                            <span className="font-semibold">{formatCurrency(detail.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Add-ons Section */}
          {(bookingCoaches.length > 0 ||
            bookingBallboys.length > 0 ||
            bookingInventories.length > 0) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Layanan Tambahan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coaches */}
                {bookingCoaches.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold">Pelatih</h4>
                    {bookingCoaches.map((coach: any, idx: number) => (
                      <div
                        key={coach.id || idx}
                        className="flex items-center justify-between border-b py-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{coach.slot?.staff?.name || 'Pelatih'}</p>
                          <p className="text-sm text-gray-600">
                            {coach.bookingCoachType?.name} -{' '}
                            {dayjs(coach.slot?.startAt).format('DD MMM YYYY, HH:mm')}
                          </p>
                        </div>
                        <span className="font-semibold">{formatCurrency(coach.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ballboys */}
                {bookingBallboys.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold">Ballboy</h4>
                    {bookingBallboys.map((ballboy: any, idx: number) => (
                      <div
                        key={ballboy.id || idx}
                        className="flex items-center justify-between border-b py-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{ballboy.slot?.staff?.name || 'Ballboy'}</p>
                          <p className="text-sm text-gray-600">
                            {dayjs(ballboy.slot?.startAt).format('DD MMM YYYY, HH:mm')}
                          </p>
                        </div>
                        <span className="font-semibold">{formatCurrency(ballboy.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inventories */}
                {bookingInventories.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold">Perlengkapan</h4>
                    {bookingInventories.map((item: any, idx: number) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between border-b py-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.inventory?.name || 'Item'}</p>
                          <p className="text-sm text-gray-600">Jumlah: {item.quantity}</p>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Ringkasan Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Layanan</span>
                <span className="font-semibold">{formatCurrency(invoice.processingFee)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg">
                <span className="font-bold">Total Pembayaran</span>
                <span className="text-primary font-bold">{formatCurrency(invoice.total)}</span>
              </div>

              {invoice.payment && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-2 font-semibold">Metode Pembayaran</h4>
                  <p className="text-gray-700">
                    {(invoice.payment as any).method || 'Transfer Bank'}
                  </p>
                  {(invoice.payment as any).accountNumber && (
                    <p className="mt-1 text-sm text-gray-600">
                      Rekening: {(invoice.payment as any).accountNumber}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Action */}
          {canPay && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-bold">Menunggu Pembayaran</h3>
                  <p className="mb-6 text-gray-600">
                    Silakan lakukan pembayaran sebelum{' '}
                    {dayjs(invoice.dueAt).format('DD MMMM YYYY, HH:mm')}
                  </p>

                  {paymentUrl ? (
                    <Button
                      size="lg"
                      className="w-full md:w-auto"
                      onClick={() => window.open(paymentUrl, '_blank')}
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Bayar Sekarang
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full md:w-auto"
                      onClick={() => router.push(`/payment/${invoice.id}`)}
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pilih Metode Pembayaran
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {invoice.status === 'PAID' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-green-800">Pembayaran Berhasil!</h3>
                  <p className="text-green-700">
                    Terima kasih telah melakukan pembayaran. Booking Anda telah dikonfirmasi.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <MainBottomNavigation />
    </div>
  );
}
