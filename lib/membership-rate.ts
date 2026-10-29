import type { BookingItem } from '@/stores/useBookingStore';
import { bookingHours } from './membership-slot-selection';

export function cheaperRegularRate(
  slot: BookingItem,
  membership?: { price: number; sessions?: number } | null
) {
  if (
    !membership ||
    !membership.sessions ||
    membership.sessions <= 0 ||
    !Number.isFinite(membership.sessions) ||
    !Number.isFinite(membership.price) ||
    membership.price <= 0
  )
    return null;
  const hours = bookingHours(slot);
  const price = (slot.discountPrice ?? 0) > 0 ? slot.discountPrice! : slot.price;
  if (!Number.isFinite(hours) || hours <= 0 || !Number.isFinite(price) || price < 0) return null;
  const regularPerHour = price / hours;
  const membershipPerHour = membership.price / membership.sessions;
  return regularPerHour < membershipPerHour ? { regularPerHour, membershipPerHour } : null;
}
