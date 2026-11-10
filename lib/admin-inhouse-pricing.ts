import type { InHouseChoice, InHousePlan, InHouseWallet } from '@/api/admin/inhouseCoaching';
import type { BookingItem } from '@/stores/useBookingStore';

/** Each choice covers one validated one-hour court slot. Server repeats all pricing checks. */
export function adminInHousePricing(
  sessions: BookingItem[],
  choices: InHouseChoice[],
  plans: InHousePlan[],
  wallets: InHouseWallet[]
) {
  return choices.reduce(
    (totals, choice) => {
      const court = sessions.find((item) => item.slotId === choice.courtSlotId);
      if (!court) return totals;
      const terms = choice.planId
        ? plans.find((plan) => plan.id === choice.planId)
        : wallets.find((wallet) => wallet.id === choice.walletId);
      totals.coverage += (court.discountPrice ?? 0) > 0 ? court.discountPrice! : court.price;
      totals.singleTotal += choice.planId ? (terms?.hourlyPrice ?? 0) : 0;
      totals.extras +=
        Math.max(0, choice.participants - 1) * (terms?.extraParticipantHourlyPrice ?? 100000);
      return totals;
    },
    { coverage: 0, singleTotal: 0, extras: 0 }
  );
}
