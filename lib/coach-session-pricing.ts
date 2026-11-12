import type { SelectedCoach } from '@/stores/useBookingStore';
/** Wall dates and times match the service slot API, independently of browser timezone. */
export function pricedCoaches(coaches: SelectedCoach[]) {
  const ends = new Map<string, number>();
  const charged = new Map<
    SelectedCoach,
    { hourlyPrice: number; extraMemberPrice: number; isAdditionalHour: boolean }
  >();
  const range = (coach: SelectedCoach) => {
    const [start, end] = coach.timeSlot.split(' - ');
    const from = Date.parse(`${coach.date}T${start}:00Z`);
    let through = Date.parse(`${coach.date}T${end ?? coach.endAt?.slice(11, 16) ?? start}:00Z`);
    if (through <= from) through += 86400000;
    return [from, through];
  };
  for (const coach of [...coaches].sort((a, b) => range(a)[0] - range(b)[0])) {
    const [start, end] = range(coach);
    const consecutive = ends.get(coach.coachId) === start && end - start === 3600000;
    const hourlyPrice = consecutive ? (coach.additionalHourPrice ?? coach.price) : coach.price;
    const extraMemberPrice = coach.coachingGroupId
      ? ((coach.participants ?? 1) - 1) * (coach.additionalHourPrice ?? coach.price)
      : 0;
    charged.set(coach, { hourlyPrice, extraMemberPrice, isAdditionalHour: consecutive });
    ends.set(coach.coachId, end);
  }
  return coaches.map((coach) => {
    const pricing = charged.get(coach)!;
    return { ...coach, ...pricing, chargedPrice: pricing.hourlyPrice + pricing.extraMemberPrice };
  });
}
export const coachSessionsTotal = (coaches: SelectedCoach[]) =>
  pricedCoaches(coaches).reduce((sum, coach) => sum + coach.chargedPrice, 0);
