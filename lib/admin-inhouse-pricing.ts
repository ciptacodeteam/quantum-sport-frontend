import { managementInHouseRate, type ManagementCustomer } from './management-pricing';
import type { InHouseChoice, InHousePlan, InHouseWallet } from '@/api/admin/inhouseCoaching';
import { resolveTariffPeriod, tariffBand, type TariffRule } from './tariff-period';
import type { BookingItem } from '@/stores/useBookingStore';

/** Each choice covers one validated one-hour court slot. Server repeats all pricing checks. */
export function adminInHousePricing(
  sessions: BookingItem[],
  choices: InHouseChoice[],
  plans: InHousePlan[],
  wallets: InHouseWallet[],
  rules: TariffRule[] = [],
  managementCustomer?: ManagementCustomer | null
) {
  return choices.reduce(
    (totals, choice) => {
      const court = sessions.find((item) => item.slotId === choice.courtSlotId);
      if (!court) return totals;
      const terms = choice.staffId
        ? {
            hourlyPrice: choice.hourlyPrice ?? 0,
            courtHourlyShare: 0,
            extraParticipantHourlyPrice: 100000
          }
        : choice.planId
          ? plans.find((plan) => plan.id === choice.planId)
          : wallets.find((wallet) => wallet.id === choice.walletId);
      if (!terms) return totals;
      const base = (court.discountPrice ?? 0) > 0 ? court.discountPrice! : court.price;
      const bands = resolveTariffPeriod(rules, court.date, court.sport);
      const managementRate = choice.walletId
        ? null
        : managementInHouseRate(managementCustomer, court.date, bands);
      const coachHourlyPrice = managementRate?.coach ?? terms.hourlyPrice;
      const courtShare = managementRate ? 0 : terms.courtHourlyShare;
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
      const fixedCourtPrice = choice.walletId
        ? null
        : (managementRate?.court ?? bands.inHouseCourtHourlyPrice);
      const courtDue =
        fixedCourtPrice ??
        (choice.staffId
          ? Math.max(0, base - (discount ?? 0))
          : discount === null
            ? 0
            : Math.max(0, base - discount));
      totals.coverage += base - courtDue;
      totals.singleTotal +=
        choice.planId || choice.staffId
          ? fixedCourtPrice != null || choice.staffId
            ? coachHourlyPrice - courtShare
            : discount === null
              ? coachHourlyPrice
              : coachHourlyPrice - courtShare
          : 0;
      totals.extras +=
        Math.max(0, choice.participants - 1) * (terms?.extraParticipantHourlyPrice ?? 100000);
      return totals;
    },
    { coverage: 0, singleTotal: 0, extras: 0 }
  );
}

/** Final court charges for applied in-house sessions, without changing the source cart prices. */
export function adminInHouseCourtPrices(
  sessions: BookingItem[],
  choices: InHouseChoice[],
  plans: InHousePlan[],
  wallets: InHouseWallet[],
  rules: TariffRule[] = [],
  managementCustomer?: ManagementCustomer | null
): Record<string, number> {
  return Object.fromEntries(
    choices.flatMap((choice) => {
      const session = sessions.find((item) => item.slotId === choice.courtSlotId);
      if (!session) return [];
      const base = (session.discountPrice ?? 0) > 0 ? session.discountPrice! : session.price;
      const { coverage } = adminInHousePricing(
        [session],
        [choice],
        plans,
        wallets,
        rules,
        managementCustomer
      );
      return [[session.slotId, base - coverage]];
    })
  );
}
