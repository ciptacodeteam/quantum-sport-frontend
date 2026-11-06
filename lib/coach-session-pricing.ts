import type { SelectedCoach } from '@/stores/useBookingStore';
/** Wall dates and times match the service slot API, independently of browser timezone. */
export function pricedCoaches(coaches: SelectedCoach[]) {
  const ends = new Map<string, number>();
  const charged = new Map<SelectedCoach, number>();
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
    charged.set(coach, consecutive ? (coach.additionalHourPrice ?? coach.price) : coach.price);
    ends.set(coach.coachId, end);
  }
  return coaches.map((coach) => ({ ...coach, chargedPrice: charged.get(coach) ?? coach.price }));
}
export const coachSessionsTotal = (coaches: SelectedCoach[]) =>
  pricedCoaches(coaches).reduce((sum, coach) => sum + coach.chargedPrice, 0);
