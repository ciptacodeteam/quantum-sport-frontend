import { useQuery } from '@tanstack/react-query';
import { adminCustomerMembershipQueryOptions } from '@/queries/admin/customer';
import { myMembershipQueryOptions } from '@/queries/membership';
import type { BookingItem } from '@/stores/useBookingStore';
import { useMemo } from 'react';

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
  isUser: boolean = false
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
    const remainingSessions = activeMembership?.remainingSessions ?? 0;
    const canUseMembership =
      activeMembership &&
      !activeMembership.isExpired &&
      !activeMembership.isSuspended &&
      remainingSessions > 0;

    // Calculate how many slots can be free (1 session = 1 slot)
    const slotsToDeduct = Math.min(bookingItems.length, remainingSessions);

    // Calculate original total
    const originalTotal = bookingItems.reduce((sum, booking) => sum + booking.price, 0);

    // Calculate discount amount
    let discountAmount = 0;
    if (canUseMembership && slotsToDeduct > 0) {
      // Sort bookings by date and time to apply discount to earliest slots
      const sortedBookings = [...bookingItems].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.timeSlot.localeCompare(b.timeSlot);
      });

      // Calculate the price of the first N slots (where N = slotsToDeduct)
      const slotsToFree = sortedBookings.slice(0, slotsToDeduct);
      discountAmount = slotsToFree.reduce((sum, booking) => sum + booking.price, 0);
    }

    const discountedTotal = originalTotal - discountAmount;

    return {
      activeMembership,
      canUseMembership: !!canUseMembership,
      remainingSessions,
      slotsToDeduct,
      discountAmount,
      originalTotal,
      discountedTotal
    };
  }, [activeMembershipData, bookingItems]);
}
