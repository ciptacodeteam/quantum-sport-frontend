import { resolveTariffPeriod, tariffBand, type TariffRule } from './tariff-period';
import type { BookingItem, SelectedCoach } from '@/stores/useBookingStore';

/** Admin preview only; the admin checkout independently calculates the saved discount. */
export function calculateAdminCoachingDiscount(
  courts: BookingItem[],
  coaches: SelectedCoach[],
  rules: TariffRule[]
) {
  return courts.reduce((total, court) => {
    if (
      !coaches.some(
        (coach) =>
          coach.date === court.date &&
          coach.timeSlot === court.timeSlot &&
          (!coach.courtSport || coach.courtSport === (court.sport ?? 'PADEL'))
      )
    )
      return total;
    const bands = resolveTariffPeriod(rules, court.date, court.sport);
    const band = tariffBand(court.timeSlot, bands);
    const amount =
      band === 'happyHour'
        ? (bands.happyCoachDiscount ?? 0)
        : band === 'peakHour'
          ? (bands.peakCoachDiscount ?? 0)
          : 0;
    const paidPrice =
      court.discountPrice && court.discountPrice > 0 ? court.discountPrice : court.price;
    return total + Math.min(amount, Math.max(0, paidPrice));
  }, 0);
}
