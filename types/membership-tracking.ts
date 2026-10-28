import type { BookingScheduleDetail } from '@/lib/booking-schedule';
export type TrackedPackage = {
  id: string;
  name: string;
  sport: 'PADEL' | 'TENNIS';
  type: 'ALL_HOUR' | 'HAPPY_HOUR' | 'AFTER_HOUR';
  status:
    | 'ACTIVE'
    | 'PENDING'
    | 'PAYMENT_FAILED'
    | 'EXPIRED'
    | 'SUSPENDED'
    | 'EXHAUSTED'
    | 'UPCOMING';
  totalHours: number;
  remainingHours: number;
  usedHours: number;
  heldHours: number;
  startDate: string;
  endDate: string;
  remainingDays: number;
  purchaseInvoice: { number: string; status: string } | null;
  usage: Array<{
    id: string;
    status: string;
    hours: number;
    createdAt: string;
    invoiceNumber: string | null;
    branch?: { id: string; name: string; address: string };
    details: BookingScheduleDetail[];
  }>;
};
export type MembershipTracking = { packages: TrackedPackage[] };
