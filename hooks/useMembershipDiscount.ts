import { useQuery } from '@tanstack/react-query';
import { adminCustomerMembershipQueryOptions } from '@/queries/admin/customer';
import { myMembershipQueryOptions } from '@/queries/membership';
import type { BookingItem } from '@/stores/useBookingStore';
import {
  isTimeAllowedForMembershipType,
  type MembershipType
} from '@/lib/membership-hours';
import { useMemo } from 'react';

function parseTimeOnDate(date: string, time: string): Date | null {
  const normalizedTime = time.includes(':') ? time : `${time}:00`;
  const parsed = new Date(`${date}T${normalizedTime}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function calculateBookingItemHours(booking: BookingItem): number {
  if (booking.startAt && booking.endAt) {
    const startAt = new Date(booking.startAt);
    const endAt = new Date(booking.endAt);
    const durationHours = (endAt.getTime() - startAt.getTime()) / 3_600_000;

    return Math.max(0, durationHours);
  }

  const [startFromRange, endFromRange] = booking.timeSlot.split(' - ');
  const start = parseTimeOnDate(booking.date, startFromRange || booking.timeSlot);
  let end = parseTimeOnDate(booking.date, booking.endTime || endFromRange || '');

  if (!start || !end) {
    return 1;
  }

  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 86_400_000);
  }

  const durationHours = (end.getTime() - start.getTime()) / 3_600_000;

  return Math.max(1, durationHours);
}

function calculateMembershipSessionsToUse(bookingItems: BookingItem[]): number {
  const totalHours = bookingItems.reduce(
    (total, booking) => total + calculateBookingItemHours(booking),
    0
  );

  if (totalHours === 0) {
    return 0;
  }

  return Math.ceil(totalHours);
}

export interface ActiveMembership {
  id: string;
  startDate: string;
  endDate: string;
  remainingSessions: number;
  remainingDuration: number;
  isExpired: boolean;
  isSuspended: boolean;
  membership: {
    id: string;
    name: string;
    price: number;
    sport?: 'PADEL' | 'TENNIS';
    type?: MembershipType;
  };
}

export interface MembershipDiscountResult {
  activeMembership: ActiveMembership | null;
  canUseMembership: boolean;
  remainingSessions: number;
  slotsToDeduct: number;
  discountAmount: number;
  originalTotal: number;
  discountedTotal: number;
}

/**
 * Custom hook to calculate membership discount for court bookings
 * @param customerId - The customer ID to fetch membership for (optional if membershipData is provided or isUser is true)
 * @param bookingItems - Array of court booking items
 * @param membershipData - Optional membership data (if provided, will skip API call)
 * @param isUser - If true, fetches membership for current logged-in user instead of customerId
 * @returns Membership discount calculation result
 */
export function useMembershipDiscount(
  customerId: string | null,
  bookingItems: BookingItem[],
  membershipData?: { activeMembership: ActiveMembership | null } | null,
  isUser: boolean = false,
  courtSport?: 'PADEL' | 'TENNIS',
  useMembership: boolean = true
): MembershipDiscountResult {
  // Fetch membership for current user if isUser is true
  const { data: userMembershipData } = useQuery({
    ...myMembershipQueryOptions,
    enabled: isUser && !membershipData
  });

  // Fetch membership for customer (admin context) if customerId is provided
  const { data: adminMembershipData } = useQuery({
    ...adminCustomerMembershipQueryOptions(customerId || ''),
    enabled: !isUser && !!customerId && !membershipData
  });

  // Use provided membership data, user membership data, or admin membership data
  const activeMembershipData = membershipData || userMembershipData || adminMembershipData;

  return useMemo(() => {
    const activeMembership = activeMembershipData?.activeMembership ?? null;
    const membershipSport = activeMembership?.membership.sport ?? 'PADEL';
    const membershipType = activeMembership?.membership.type ?? 'ALL_HOUR';
    const bookingSport = courtSport ?? bookingItems[0]?.sport;
    const isMatchingSport = !bookingSport || membershipSport === bookingSport;
    const eligibleBookingItems = bookingItems.filter((booking) =>
      isTimeAllowedForMembershipType(membershipType, booking.timeSlot)
    );
    const allBookingItemsEligible =
      bookingItems.length === 0 || eligibleBookingItems.length === bookingItems.length;
    const remainingSessions = activeMembership?.remainingSessions ?? 0;
    const sessionsToDeduct = calculateMembershipSessionsToUse(bookingItems);
    const canUseMembership =
      activeMembership &&
      useMembership &&
      !activeMembership.isExpired &&
      !activeMembership.isSuspended &&
      isMatchingSport &&
      allBookingItemsEligible &&
      sessionsToDeduct > 0 &&
      remainingSessions >= sessionsToDeduct;

    // Calculate original total
    const originalTotal = bookingItems.reduce((sum, booking) => {
      const normalPrice = booking.normalPrice ?? booking.price;
      const discountPrice = booking.discountPrice ?? 0;
      const effectivePrice = discountPrice > 0 ? discountPrice : booking.price;
      return sum + (canUseMembership ? normalPrice : effectivePrice);
    }, 0);

    // Calculate discount amount
    let discountAmount = 0;
    if (canUseMembership) {
      discountAmount = bookingItems.reduce((sum, booking) => {
        const normalPrice = booking.normalPrice ?? booking.price;
        return sum + normalPrice;
      }, 0);
    }

    const discountedTotal = originalTotal - discountAmount;

    return {
      activeMembership,
      canUseMembership: !!canUseMembership,
      remainingSessions,
      slotsToDeduct: sessionsToDeduct,
      discountAmount,
      originalTotal,
      discountedTotal
    };
  }, [activeMembershipData, bookingItems, courtSport, useMembership]);
}
