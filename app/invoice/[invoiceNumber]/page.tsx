'use client';

import MainHeader from '@/components/headers/MainHeader';
import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { invoiceQueryOptions } from '@/queries/invoice';
import type { Booking, Invoice, MembershipUser } from '@/types/model';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { ArrowLeft, FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { toast } from 'sonner';
import InvoiceHeader from '@/components/invoice/InvoiceHeader';
import InvoiceInfoCard from '@/components/invoice/InvoiceInfoCard';
import CustomerInfoCard from '@/components/invoice/CustomerInfoCard';
import BookingDetailsCard from '@/components/invoice/BookingDetailsCard';
import MembershipDetailsCard from '@/components/invoice/MembershipDetailsCard';
import AddOnsCard from '@/components/invoice/AddOnsCard';
import PaymentSummaryCard from '@/components/invoice/PaymentSummaryCard';
import PaymentActionCard from '@/components/invoice/PaymentActionCard';
import SuccessMessageCard from '@/components/invoice/SuccessMessageCard';

dayjs.locale('id');

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceNumber = params.invoiceNumber as string;

  const { data: response, isPending, isError } = useQuery(invoiceQueryOptions(invoiceNumber));

  const invoice = response?.data as Invoice | undefined;
  const booking = invoice?.booking as Booking | undefined;
  const membershipUser = invoice?.membershipUser as MembershipUser | undefined;

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
  const bookingInventories = booking?.inventories || [];
  const bookingCoaches = booking?.coaches || [];
  const bookingBallboys = booking?.ballboys || [];
  const canPay =
    ['PENDING', 'HOLD'].includes(invoice.status) &&
    (!invoice.dueDate || dayjs().isBefore(dayjs(invoice.dueDate)));

  return (
    <div className="min-h-screen">
      <MainHeader />

      <div className="container mx-auto mt-28 px-4 pb-24 lg:mt-28">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          {/* Header */}
          <InvoiceHeader
            number={invoice.number}
            status={invoice.status}
            onBack={() => router.back()}
            onCopy={() => {
              navigator.clipboard.writeText(invoice.number);
              toast.success('Nomor invoice disalin');
            }}
          />

          {/* Invoice Information */}
          <InvoiceInfoCard
            issuedAt={invoice.issuedAt}
            dueDate={invoice.dueDate}
            paidAt={invoice.paidAt}
            bookingStatus={booking?.status}
          />

          {/* Customer Information */}
          <CustomerInfoCard user={(invoice as any).user} />

          {/* Membership Details (if membership purchase) */}
          {membershipUser && <MembershipDetailsCard membershipUser={membershipUser} />}

          {/* Booking Details (if booking invoice) */}
          {booking && bookingDetails.length > 0 && (
            <BookingDetailsCard details={bookingDetails as any} />
          )}

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
            subtotal={invoice.subtotal}
            processingFee={invoice.processingFee}
            total={invoice.total}
            method={(invoice.payment as any)?.method}
          />

          {/* Payment Action */}
          <PaymentActionCard
            invoice={invoice}
            canPay={canPay}
            onChooseMethod={() => router.push(`/payment/${invoice.id}`)}
          />

          {/* Success Message */}
          {invoice.status === 'PAID' && <SuccessMessageCard />}
        </div>
      </div>
      <MainBottomNavigation />
    </div>
  );
}
