'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { invoiceQueryOptions } from '@/queries/invoice';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { ArrowLeft, FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
// Local typed view-models for the invoice detail API response
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
    slot?: { startAt?: string; staff?: { name?: string } };
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
  id: string;
  number: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | string;
  subtotal: number;
  processingFee: number;
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
import CustomerInfoCard from '@/components/invoice/CustomerInfoCard';
import InvoiceInfoCard from '@/components/invoice/InvoiceInfoCard';
import MembershipDetailsCard from '@/components/invoice/MembershipDetailsCard';
import PaymentActionCard from '@/components/invoice/PaymentActionCard';
import PaymentSummaryCard from '@/components/invoice/PaymentSummaryCard';
import SuccessMessageCard from '@/components/invoice/SuccessMessageCard';

dayjs.locale('id');

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceNumber = params.invoiceNumber as string;

  const {
    data: response,
    isPending,
    isError,
    isLoading,
    refetch
  } = useQuery({
    ...invoiceQueryOptions(invoiceNumber),
    // Poll every 3 seconds when status is PENDING or HOLD
    refetchInterval: (query) => {
      const typedData = query.state.data as InvoiceDetailApiResponse | undefined;
      const status = typedData?.data?.status;
      // Stop polling if payment is completed (PAID, FAILED, EXPIRED, CANCELLED)
      if (['PAID', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(status || '')) {
        return false;
      }
      // Poll every 3 seconds for pending payments
      return 3000;
    },
    refetchIntervalInBackground: true // Continue polling even when tab is not focused
  });

  const handleExpired = () => {
    // Refetch invoice data when countdown expires
    refetch();
  };

  const typedResponse = response as InvoiceDetailApiResponse | undefined;
  const invoice = typedResponse?.data;
  const booking = invoice?.booking ?? undefined;
  const membershipUser = invoice?.membershipUser ?? undefined;

  // Show loading state while fetching initial data
  if (isLoading || (isPending && !response)) {
    return (
      <div className="min-h-screen">
        <MainHeader title="Detail Transaksi" withLogo={false} backHref="/invoice" />
        <div className="container mx-auto mt-28 pb-10">
          <div className="mx-auto w-11/12 max-w-7xl">
            <div className="animate-pulse space-y-4">
              {/* Payment Action Card Skeleton */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="mx-auto h-6 w-32 rounded bg-gray-200"></div>
                    <div className="mx-auto h-10 w-48 rounded bg-gray-200"></div>
                    <div className="mx-auto h-32 w-32 rounded-lg bg-gray-200"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Info Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-5 w-32 rounded bg-gray-200"></div>
                    <div className="h-4 w-48 rounded bg-gray-200"></div>
                    <div className="h-4 w-40 rounded bg-gray-200"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-5 w-40 rounded bg-gray-200"></div>
                    <div className="h-4 w-56 rounded bg-gray-200"></div>
                    <div className="h-4 w-44 rounded bg-gray-200"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-5 w-36 rounded bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-20 w-full rounded bg-gray-200"></div>
                      <div className="h-20 w-full rounded bg-gray-200"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 rounded bg-gray-200"></div>
                      <div className="h-4 w-32 rounded bg-gray-200"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-28 rounded bg-gray-200"></div>
                      <div className="h-4 w-28 rounded bg-gray-200"></div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <div className="h-6 w-20 rounded bg-gray-200"></div>
                        <div className="h-6 w-36 rounded bg-gray-200"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
  const bookingInventories = booking?.inventories || [];
  const bookingCoaches = booking?.coaches || [];
  const bookingBallboys = booking?.ballboys || [];
  const bookingCourtDiscountTotal = booking
    ? (booking.courtDiscountPrice ??
      bookingDetails.reduce((sum, detail) => {
        const normalPrice = detail.price || detail.slot?.price || 0;
        const discountPrice = detail.discountPrice ?? detail.slot?.discountPrice ?? 0;
        const effectivePrice = discountPrice > 0 ? discountPrice : normalPrice;
        return sum + effectivePrice;
      }, 0))
    : 0;
  const bookingAddOnsTotal = booking
    ? bookingCoaches.reduce((sum, item: any) => sum + (item.price || 0), 0) +
      bookingBallboys.reduce((sum, item: any) => sum + (item.price || 0), 0) +
      bookingInventories.reduce(
        (sum, item: any) => sum + (item.price || 0) * (item.quantity || 0),
        0
      )
    : 0;
  const subtotalForDisplay = booking
    ? bookingCourtDiscountTotal + bookingAddOnsTotal
    : invoice.subtotal;
  const canPay =
    ['PENDING', 'HOLD'].includes(invoice.status) &&
    (!invoice.dueDate || dayjs().isBefore(dayjs(invoice.dueDate)));

  return (
    <div className="min-h-screen">
      <MainHeader title="Detail Transaksi" withLogo={false} backHref="/invoice" />

      <div className="container mx-auto mt-28 pb-10">
        <div className="mx-auto w-11/12 max-w-7xl">
          {/* Payment Action */}
          <PaymentActionCard
            invoice={invoice as any}
            canPay={canPay}
            onChooseMethod={() => router.push(`/payment/${invoice.id}`)}
            onExpired={handleExpired}
          />

          {/* Success Message */}
          {invoice.status === 'PAID' && <SuccessMessageCard />}

          {/* {membershipUser && (
            <div className="mb-4">
              <Badge className="border-amber-200 bg-amber-100 text-amber-800" variant="outline">
                Invoice Membership
              </Badge>
            </div>
          )} */}

          {/* Invoice Information */}
          <InvoiceInfoCard
            invoiceNumber={invoice.number}
            issuedAt={invoice.issuedAt}
            dueDate={invoice.dueDate}
            paidAt={invoice.paidAt}
            invoiceStatus={invoice.status}
          />

          {/* Customer Information */}
          <CustomerInfoCard
            user={invoice.user as { name?: string | null; phone?: string | null }}
          />

          {/* Membership Details (if membership purchase) */}
          {membershipUser && (
            <MembershipDetailsCard membershipUser={membershipUser as unknown as any} />
          )}

          {/* Booking Details (if booking invoice) */}
          {booking && bookingDetails.length > 0 && <BookingDetailsCard details={bookingDetails} />}

          {/* Add-ons Section (only for bookings) */}
          {booking && (
            <AddOnsCard
              coaches={bookingCoaches as any}
              ballboys={bookingBallboys as any}
              inventories={bookingInventories as any}
            />
          )}

          {/* Payment Summary */}
          <PaymentSummaryCard
            subtotal={subtotalForDisplay}
            processingFee={invoice.processingFee}
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
        </div>
      </div>
    </div>
  );
}
