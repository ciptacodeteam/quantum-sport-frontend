export type MembershipType = 'ALL_HOUR' | 'HAPPY_HOUR' | 'AFTER_HOUR';

export const membershipTypeLabels: Record<MembershipType, string> = {
  ALL_HOUR: 'All Hour',
  HAPPY_HOUR: 'Happy Hour',
  AFTER_HOUR: 'Peak Hour'
};

export const membershipTypeDescriptions: Record<MembershipType, string> = {
  ALL_HOUR: 'Semua jam',
  HAPPY_HOUR: 'Mengikuti jam Happy Hour cabang',
  AFTER_HOUR: 'Mengikuti jam Peak Hour cabang'
};

export function getHourFromTime(value: string | Date) {
  if (value instanceof Date) {
    return value.getHours();
  }

  const time = value.includes(' - ') ? value.split(' - ')[0] : value;
  const match = time.match(/(?:T|\s|^)(\d{2}):(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  return Number.isFinite(hour) ? hour : null;
}

export function isTimeAllowedForMembershipType(
  membershipType: MembershipType | null | undefined,
  value: string | Date,
  options: {
    rules?: TariffRule[];
    date?: string;
    sport?: 'PADEL' | 'TENNIS';
    endAt?: string | Date;
  } = {}
) {
  if (!membershipType || membershipType === 'ALL_HOUR') return true;

  const band = tariffBand(
    value,
    resolveTariffPeriod(options.rules ?? [], options.date, options.sport),
    options.endAt
  );
  return membershipType === 'HAPPY_HOUR' ? band === 'happyHour' : band === 'peakHour';
}
import {
  formatTariffHour,
  resolveTariffPeriod,
  tariffBand,
  type TariffRule
} from '@/lib/tariff-period';

export function describeMembershipHours(
  type: MembershipType,
  rules: TariffRule[],
  date?: string,
  sport?: 'PADEL' | 'TENNIS'
) {
  if (type === 'ALL_HOUR') return 'Semua jam operasional';
  const bands = resolveTariffPeriod(rules, date, sport);
  return type === 'HAPPY_HOUR'
    ? `${formatTariffHour(bands.happyStart)} – ${formatTariffHour(bands.happyEnd)}`
    : `${formatTariffHour(bands.peakStart)} – ${formatTariffHour(bands.peakEnd)}`;
}
