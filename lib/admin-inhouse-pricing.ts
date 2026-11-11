import type { InHouseChoice, InHousePlan, InHouseWallet } from '@/api/admin/inhouseCoaching';
import { resolveTariffPeriod, tariffBand, type TariffRule } from './tariff-period';
import type { BookingItem } from '@/stores/useBookingStore';

/** Each choice covers one validated one-hour court slot. Server repeats all pricing checks. */
export function adminInHousePricing(
  sessions: BookingItem[],
  choices: InHouseChoice[],
  plans: InHousePlan[],
  wallets: InHouseWallet[],
  rules: TariffRule[] = []
) {
  return choices.reduce(
    (totals, choice) => {
      const court = sessions.find((item) => item.slotId === choice.courtSlotId);
      if (!court) return totals;
      const terms = choice.planId
        ? plans.find((plan) => plan.id === choice.planId)
        : wallets.find((wallet) => wallet.id === choice.walletId);
      if (!terms) return totals;
      const base = (court.discountPrice ?? 0) > 0 ? court.discountPrice! : court.price;
      const bands = resolveTariffPeriod(rules, court.date, court.sport);
      const band = court.timeSlot ? tariffBand(court.timeSlot, bands) : null;
      const discount =
        bands.happyInHouseCoachDiscount == null && bands.peakInHouseCoachDiscount == null
          ? null
          : band === 'happyHour'
            ? (bands.happyInHouseCoachDiscount ?? null)
            : band === 'peakHour'
              ? (bands.peakInHouseCoachDiscount ?? null)
              : rules.length
                ? 0
                : null;
      const courtDue =
        discount === null
          ? 0
          : Math.max(0, base - discount - (choice.walletId ? terms.courtHourlyShare : 0));
      totals.coverage += base - courtDue;
      totals.singleTotal += choice.planId
        ? discount === null
          ? terms.hourlyPrice
          : terms.hourlyPrice - terms.courtHourlyShare
        : 0;
      totals.extras +=
        Math.max(0, choice.participants - 1) * (terms?.extraParticipantHourlyPrice ?? 100000);
      return totals;
    },
    { coverage: 0, singleTotal: 0, extras: 0 }
  );
}
