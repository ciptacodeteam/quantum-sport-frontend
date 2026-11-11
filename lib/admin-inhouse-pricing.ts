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
  const schedulePrices = new Map<string, number>();
  const ends = new Map<string, number>();
  const start = (choice: InHouseChoice) => {
    const court = sessions.find((item) => item.slotId === choice.courtSlotId);
    return court ? Date.parse(`${court.date}T${court.timeSlot.slice(0, 5)}:00Z`) : 0;
  };
  for (const choice of choices.filter((c) => c.staffId).sort((a, b) => start(a) - start(b))) {
    const from = start(choice);
    schedulePrices.set(
      choice.coachSlotId,
      ends.get(choice.staffId!) === from
        ? (choice.additionalHourPrice ?? choice.hourlyPrice ?? 0)
        : (choice.hourlyPrice ?? 0)
    );
    ends.set(choice.staffId!, from + 3600000);
  }
  return choices.reduce(
    (totals, choice) => {
      const court = sessions.find((item) => item.slotId === choice.courtSlotId);
      if (!court) return totals;
      const terms = choice.staffId
        ? {
            hourlyPrice: schedulePrices.get(choice.coachSlotId) ?? 0,
            courtHourlyShare: 0,
            extraParticipantHourlyPrice: 100000
          }
        : choice.planId
          ? plans.find((plan) => plan.id === choice.planId)
          : wallets.find((wallet) => wallet.id === choice.walletId);
      if (!terms) return totals;
      const base = (court.discountPrice ?? 0) > 0 ? court.discountPrice! : court.price;
      const bands = resolveTariffPeriod(rules, court.date, court.sport);
      const band = court.timeSlot ? tariffBand(court.timeSlot, bands) : null;
      const discount =
        choice.walletId ||
        choice.staffId ||
        (bands.happyInHouseCoachDiscount == null && bands.peakInHouseCoachDiscount == null)
          ? null
          : band === 'happyHour'
            ? (bands.happyInHouseCoachDiscount ?? null)
            : band === 'peakHour'
              ? (bands.peakInHouseCoachDiscount ?? null)
              : rules.length
                ? 0
                : null;
      const courtDue = choice.staffId
        ? Math.max(0, base - (discount ?? 0))
        : discount === null
          ? 0
          : Math.max(0, base - discount);
      totals.coverage += base - courtDue;
      totals.singleTotal +=
        choice.planId || choice.staffId
          ? choice.staffId
            ? terms.hourlyPrice - terms.courtHourlyShare
            : discount === null
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
