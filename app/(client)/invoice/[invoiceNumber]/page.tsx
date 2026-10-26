'use client';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { invoiceQueryOptions } from '@/queries/invoice';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PaymentLoading from '@/components/invoice/PaymentLoading';
import PaymentOutcomeCard from '@/components/invoice/PaymentOutcomeCard';
type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

type ApiPaymentMethod = {
  id: string;
  name: string;
  logo?: string | null;
  channel?: string | null;
  fees?: number;
  percentage?: string;
};

type ApiPaymentMeta = {
  status?: string;
  updated?: string;
  captures?: Array<{
    capture_id: string;
    capture_amount: number;
    capture_timestamp: string;
  }>;
  currency?: string;
  metadata?: Record<string, any>;
  payment_id?: string;
  channel_code?: string;
  reference_id?: string;
  request_amount?: number;
  payment_details?: Record<string, any>;
  payment_request_id?: string;
  // Optional fields observed in some channels
  channel_properties?: Record<string, any>;
  actions?: Array<{
    descriptor?: string;
    type?: string;
    value?: string;
    url?: string;
    display_name?: string;
    expiry?: string;
  }>;
};

type ApiPayment = {
  id: string;
  status: string;
  amount: number;
  fees: number;
  externalRef?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  meta?: ApiPaymentMeta;
  method?: ApiPaymentMethod;
};

type ApiBookingDetail = {
  id: string;
  price: number;
  discountPrice?: number | null;
  slot?: {
    id: string;
    type: 'COURT' | 'COACH' | 'BALLBOY' | string;
    courtId?: string | null;
    staffId?: string | null;
    startAt?: string;
    endAt?: string;
    price?: number;
    discountPrice?: number | null;
    isAvailable?: boolean;
    createdAt?: string;
    updatedAt?: string;
    court?: { id: string; name: string };
    staff?: { id: string; name: string };
  };
  court?: { id: string; name: string } | null;
};

type ApiBooking = {
  id: string;
  status: 'HOLD' | 'CONFIRMED' | 'CANCELLED' | string;
  totalPrice: number;
  processingFee: number;
  courtNormalPrice?: number;
  courtDiscountPrice?: number;
  membershipSessionsUsed?: number;
  createdAt: string;
  details?: ApiBookingDetail[];
  inventories?: Array<{
    id: string;
    inventory?: { id: string; name: string };
    quantity: number;
    price: number;
  }>;
  coaches?: Array<{
    id: string;
    price: number;
    slot?: { startAt?: string; staff?: { name?: string } };
    bookingCoachType?: { name?: string };
  }>;
  ballboys?: Array<{
    id: string;
    price: number;
    slot?: { startAt?: string; endAt?: string; staff?: { name?: string } };
  }>;
};

type ApiMembership = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  sessions: number;
  duration: number;
  benefits?: Array<{ id: string; benefit: string }>;
};

type ApiMembershipUser = {
  id: string;
  membershipId: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  remainingSessions: number;
  remainingDuration: number;
  isExpired: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  suspensionEndDate: string | null;
  membership?: ApiMembership;
};

type InvoiceDetail = {
  branch?: { id: string; name: string; address: string };
  id: string;
  number: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | string;
  subtotal: number;
  processingFee: number;
  promoDiscountAmount?: number;
  total: number;
  issuedAt: string;
  dueDate: string | null;
  paidAt: string | null;
  user?: ApiUser;
  booking?: ApiBooking | null;
  classBooking?: any | null;
  membershipUser?: ApiMembershipUser | null;
  payment?: ApiPayment | null;
  paymentMeta?: ApiPaymentMeta | null;
  paymentInstructions?: any | null;
  paymentUrl?: string | null;
};

type InvoiceDetailApiResponse = {
  success: boolean;
  msg: string;
  code: number;
  data: InvoiceDetail;
};

import AddOnsCard from '@/components/invoice/AddOnsCard';
import BookingDetailsCard from '@/components/invoice/BookingDetailsCard';
import MembershipDetailsCard from '@/components/invoice/MembershipDetailsCard';
import PaymentActionCard from '@/components/invoice/PaymentActionCard';
import PaymentSummaryCard from '@/components/invoice/PaymentSummaryCard';
import SuccessMessageCard from '@/components/invoice/SuccessMessageCard';

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceNumber = params.invoiceNumber as string;
  const {
    data: response,
    isPending,
    isFetching,
    refetch
  } = useQuery({
    ...invoiceQueryOptions(invoiceNumber),
    refetchInterval: (query) =>
      ['PAID', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(
        (query.state.data as InvoiceDetailApiResponse | undefined)?.data?.status || ''
      )
        ? false
        : 3000,
    refetchIntervalInBackground: true
  });
  const invoice = (response as InvoiceDetailApiResponse | undefined)?.data;
  if (isPending && !invoice) return <PaymentLoading />;
  if (!invoice)
    return (
      <>
        <MainHeader />
        <main className="invoice-page mx-auto max-w-2xl px-5 pt-28 pb-12">
          <PaymentOutcomeCard status="UNKNOWN">
            <div className="flex flex-col gap-3">
              <Button
                className="h-12 rounded-full"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                Coba lagi
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full">
                <Link href="/invoice">Riwayat pemesanan</Link>
              </Button>
            </div>
          </PaymentOutcomeCard>
        </main>
      </>
    );
  const booking = invoice.booking;
  const details = booking?.details || [];
  const inventories = booking?.inventories || [];
  const coaches = booking?.coaches || [];
  const ballboys = booking?.ballboys || [];
  const courtSubtotal =
    booking?.courtDiscountPrice ??
    details.reduce((sum, detail) => {
      const discount = detail.discountPrice ?? detail.slot?.discountPrice ?? 0;
      return sum + (discount > 0 ? discount : detail.price || detail.slot?.price || 0);
    }, 0);
  const subtotal = booking
    ? courtSubtotal +
      coaches.reduce((sum, item) => sum + (item.price || 0), 0) +
      ballboys.reduce((sum, item) => sum + (item.price || 0), 0) +
      inventories.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
    : invoice.subtotal;
  const pending = ['PENDING', 'HOLD', 'AWAITING_CONFIRMATION'].includes(invoice.status);
  const canPay = pending && (!invoice.dueDate || Date.now() < new Date(invoice.dueDate).getTime());
  return (
    <>
      <MainHeader />
      <main className="invoice-page mx-auto w-full max-w-7xl px-5 pt-24 pb-12 text-[#171717] sm:px-8 lg:pb-16 xl:pt-32">
        <header className="mb-5">
          {pending && (
            <h1 className="mb-2 text-2xl font-medium tracking-tight sm:text-3xl">Pembayaran</h1>
          )}
          <p className="text-xs break-all text-black/45">Invoice {invoice.number}</p>
        </header>
        {invoice.branch && (
          <section
            aria-label="Lokasi transaksi"
            className="mb-6 border border-black/15 bg-[#f8f8f6] p-5"
          >
            <p className="text-[10px] tracking-wider text-black/45 uppercase">Cabang</p>
            <p className="mt-2 text-sm font-medium">{invoice.branch.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-black/50">{invoice.branch.address}</p>
          </section>
        )}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            {canPay && (
              <PaymentActionCard
                invoice={invoice}
                canPay={canPay}
                onExpired={() => void refetch()}
                onRefresh={() => void refetch()}
                isRefreshing={isFetching}
              />
            )}
            {invoice.status === 'PAID' &&
              (invoice.total === 0 && (booking?.membershipSessionsUsed ?? 0) > 0 ? (
                <PaymentOutcomeCard
                  status="PAID"
                  title="Pemesanan berhasil"
                  description="Jadwal Anda telah dikonfirmasi menggunakan Value Pack. Tidak ada pembayaran tambahan."
                />
              ) : (
                <SuccessMessageCard />
              ))}
            {['FAILED', 'EXPIRED', 'CANCELLED'].includes(invoice.status) && (
              <PaymentOutcomeCard status={invoice.status}>
                <Button asChild className="h-12 rounded-full px-7">
                  <Link
                    href={
                      invoice.membershipUser
                        ? '/membership'
                        : details.length
                          ? '/booking'
                          : '/add-ons'
                    }
                  >
                    Buat pesanan baru
                  </Link>
                </Button>
              </PaymentOutcomeCard>
            )}
            {pending && !canPay && (
              <PaymentOutcomeCard
                status="PENDING"
                description="Batas waktu pembayaran telah berakhir. Periksa status terbaru transaksi Anda."
              >
                <Button
                  variant="outline"
                  className="h-12 rounded-full"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                >
                  {isFetching ? 'Memeriksa…' : 'Periksa status'}
                </Button>
              </PaymentOutcomeCard>
            )}
            {(invoice.membershipUser ||
              details.length > 0 ||
              inventories.length > 0 ||
              coaches.length > 0 ||
              ballboys.length > 0) && (
              <details className="border border-black/15 bg-white">
                <summary className="cursor-pointer px-5 py-4 text-sm font-medium marker:text-[#ad422b] focus-visible:outline-2 focus-visible:outline-[#ad422b] sm:px-6">
                  Detail pesanan
                </summary>
                <div className="space-y-4 border-t border-black/10 p-4 sm:p-5">
                  {invoice.membershipUser && (
                    <MembershipDetailsCard membershipUser={invoice.membershipUser} />
                  )}
                  {!!details.length && (
                    <BookingDetailsCard
                      details={details}
                      coveredByMembership={(booking?.membershipSessionsUsed ?? 0) > 0}
                    />
                  )}
                  {booking && (
                    <AddOnsCard
                      coaches={coaches}
                      ballboys={ballboys}
                      inventories={inventories}
                      details={details}
                    />
                  )}
                </div>
              </details>
            )}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-28">
            <PaymentSummaryCard
              subtotal={subtotal}
              processingFee={invoice.processingFee}
              promoDiscountAmount={invoice.promoDiscountAmount}
              total={invoice.total}
              method={
                invoice.payment?.method
                  ? {
                      name: invoice.payment.method.name,
                      logo: invoice.payment.method.logo || undefined,
                      channel: invoice.payment.method.channel || undefined
                    }
                  : undefined
              }
            />
            <Button asChild variant="outline" className="h-12 w-full rounded-full border-black/20">
              <Link href="/invoice">Lihat riwayat pemesanan</Link>
            </Button>
          </aside>
        </div>
      </main>
    </>
  );
}
