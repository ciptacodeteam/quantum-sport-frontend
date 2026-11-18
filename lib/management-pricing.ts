import type { BookingItem } from '@/stores/useBookingStore';

export type ManagementCustomer = {
  isManagement?: boolean;
  managementCourtHourlyPrice?: number | null;
  managementCoachHourlyPrice?: number | null;
  managementValidFrom?: string | Date | null;
  managementValidUntil?: string | Date | null;
};

const dateKey = (value: string | Date) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
/** Dashboard quotes only; the server verifies customer eligibility again. */
export function managementInHouseRate(
  customer: ManagementCustomer | null | undefined,
  playingAt: string
) {
  if (!customer?.isManagement) return null;
  const day = dateKey(playingAt);
  if (customer.managementValidFrom && day < dateKey(customer.managementValidFrom)) return null;
  if (customer.managementValidUntil && day > dateKey(customer.managementValidUntil)) return null;
  const court =
    (customer.managementCourtHourlyPrice ?? 0) > 0 ? customer.managementCourtHourlyPrice! : null;
  const coach =
    (customer.managementCoachHourlyPrice ?? 0) > 0 ? customer.managementCoachHourlyPrice! : null;
  if (court === null && coach === null) return null;
  return { court, coach };
}
/** Court-only/club bookings; in-house selections price their own court component. */
export function managementCourtPricing(
  sessions: BookingItem[],
  customer?: ManagementCustomer | null,
  excludedSlots: string[] = [],
  membershipCovered = false
) {
  const courtPrices: Record<string, number> = {};
  let coverage = 0;
  if (membershipCovered) return { courtPrices, coverage };
  for (const session of sessions) {
    if (excludedSlots.includes(session.slotId)) continue;
    const rate = managementInHouseRate(customer, session.date);
    if (rate?.court == null) continue;
    const [start, end] = session.timeSlot.split(' - ');
    const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
    const startMinutes = minutes(start);
    let endMinutes = minutes(end || session.endTime);
    if (endMinutes <= startMinutes) endMinutes += 1440;
    const duration =
      session.startAt && session.endAt
        ? (Date.parse(session.endAt) - Date.parse(session.startAt)) / 3600000
        : (endMinutes - startMinutes) / 60;
    if (!Number.isFinite(duration) || duration <= 0) continue;
    const price = Math.round(rate.court * duration);
    courtPrices[session.slotId] = price;
    coverage += ((session.discountPrice ?? 0) > 0 ? session.discountPrice! : session.price) - price;
  }
  return { courtPrices, coverage };
}
