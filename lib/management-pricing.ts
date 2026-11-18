import { resolveTariffPeriod, tariffBand, type TariffRule } from './tariff-period';
import type { BookingItem } from '@/stores/useBookingStore';

export type ManagementCustomer = {
  isManagement?: boolean;
  managementCourtHourlyPrice?: number | null;
  managementCoachHourlyPrice?: number | null;
  managementPadelHappyHourlyPrice?: number | null;
  managementPadelPeakHourlyPrice?: number | null;
  managementTennisHappyHourlyPrice?: number | null;
  managementTennisPeakHourlyPrice?: number | null;
  managementValidFrom?: string | Date | null;
  managementValidUntil?: string | Date | null;
};

const dateKey = (value: string | Date) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
/** Dashboard quotes only; the server verifies customer eligibility again. */
function managementEligible(
  customer: ManagementCustomer | null | undefined,
  playingAt: string
): customer is ManagementCustomer {
  if (!customer?.isManagement) return false;
  const day = dateKey(playingAt);
  if (customer.managementValidFrom && day < dateKey(customer.managementValidFrom)) return false;

  return true;
}
export function managementInHouseRate(
  customer: ManagementCustomer | null | undefined,
  playingAt: string
) {
  if (!managementEligible(customer, playingAt)) return null;
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
  membershipCovered = false,
  rules: TariffRule[] = []
) {
  const courtPrices: Record<string, number> = {};
  let coverage = 0;
  if (membershipCovered) return { courtPrices, coverage };
  for (const session of sessions) {
    if (excludedSlots.includes(session.slotId)) continue;
    if (!managementEligible(customer, session.date)) continue;
    const band = tariffBand(
      session.timeSlot,
      resolveTariffPeriod(rules, session.date, session.sport)
    );
    if (!band) continue;
    const rate =
      session.sport === 'PADEL'
        ? band === 'happyHour'
          ? customer.managementPadelHappyHourlyPrice
          : customer.managementPadelPeakHourlyPrice
        : session.sport === 'TENNIS'
          ? band === 'happyHour'
            ? customer.managementTennisHappyHourlyPrice
            : customer.managementTennisPeakHourlyPrice
          : null;
    if (rate == null || rate <= 0) continue;
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
    const price = Math.round(rate * duration);
    courtPrices[session.slotId] = price;
    coverage += ((session.discountPrice ?? 0) > 0 ? session.discountPrice! : session.price) - price;
  }
  return { courtPrices, coverage };
}
