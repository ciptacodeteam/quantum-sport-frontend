import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

export const defaultTariffPeriod = { happyStart: 6, happyEnd: 15, peakStart: 15, peakEnd: 24 };
export type TariffBands = typeof defaultTariffPeriod;
export type TariffRule = TariffBands & {
  id: string;
  branchId: string;
  sport: 'PADEL' | 'TENNIS';
  effectiveFrom: string;
};
export type TariffPeriodInput = TariffBands & { sport: 'PADEL' | 'TENNIS'; effectiveFrom: string };
export type TariffPeriodResponse = { rules: TariffRule[]; defaults: TariffBands };
export const jakartaToday = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
export const formatTariffHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
export function resolveTariffPeriod(
  rules: TariffRule[],
  date = jakartaToday(),
  sport: 'PADEL' | 'TENNIS' = 'PADEL'
): TariffBands {
  return (
    rules
      .filter(
        (rule) => rule.sport === sport && rule.effectiveFrom.slice(0, 10) <= date.slice(0, 10)
      )
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? defaultTariffPeriod
  );
}
export function tariffBand(
  value: string | Date,
  bands: TariffBands,
  endAt?: string | Date
): 'happyHour' | 'peakHour' | null {
  const minutes = (input: string | Date) => {
    if (input instanceof Date)
      return dayjs(input).tz('Asia/Jakarta').hour() * 60 + dayjs(input).tz('Asia/Jakarta').minute();
    if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(input))
      return dayjs(input).tz('Asia/Jakarta').hour() * 60 + dayjs(input).tz('Asia/Jakarta').minute();
    const match = input.match(/(?:T|\s|^)(\d{2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
  };
  const start = minutes(value);
  const rangeEnd = typeof value === 'string' ? value.split(' - ')[1] : undefined;
  const endValue = endAt ?? rangeEnd;
  let end = endValue ? minutes(endValue) : start;
  if (endValue && end <= start) end += 1440;
  for (const band of ['happy', 'peak'] as const) {
    if (
      start >= bands[`${band}Start`] * 60 &&
      start < bands[`${band}End`] * 60 &&
      end <= bands[`${band}End`] * 60
    )
      return band === 'happy' ? 'happyHour' : 'peakHour';
  }
  return null;
}
