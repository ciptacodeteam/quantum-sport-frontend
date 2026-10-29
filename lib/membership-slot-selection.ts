import type { BookingItem } from '@/stores/useBookingStore';
import { isTimeAllowedForMembershipType, type MembershipType } from '@/lib/membership-hours';

type Membership = {
  isExpired: boolean;
  isSuspended: boolean;
  remainingSessions: number;
  startDate: string;
  endDate: string;
  membership: { sport?: 'PADEL' | 'TENNIS'; type?: MembershipType };
};

export function bookingHours(item: BookingItem): number {
  if (item.startAt && item.endAt) {
    return Math.max(0, (Date.parse(item.endAt) - Date.parse(item.startAt)) / 3_600_000);
  }
  const [start, end] = item.timeSlot.split(' - ');
  const from = Date.parse(`${item.date}T${start.length === 5 ? start + ':00' : start}+07:00`);
  const endTime = item.endTime || end;
  if (!endTime) return 1;
  let to = Date.parse(`${item.date}T${endTime.length === 5 ? endTime + ':00' : endTime}+07:00`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 1;
  if (to <= from) to += 86_400_000;
  return (to - from) / 3_600_000;
}

export function selectMembershipSlots(
  items: BookingItem[],
  membership: Membership | null,
  requestedIds: string[] | null,
  sport?: 'PADEL' | 'TENNIS',
  now = Date.now()
) {
  const reasons: Record<string, string> = {};
  const eligible = items.filter((item) => {
    let reason = '';
    if (!membership) reason = 'Membership belum tersedia';
    else if (membership.isExpired || Date.parse(membership.endDate) <= now)
      reason = 'Membership sudah berakhir';
    else if (membership.isSuspended) reason = 'Membership sedang ditangguhkan';
    else if (Date.parse(membership.startDate) > now) reason = 'Membership belum aktif';
    else if ((membership.membership.sport ?? 'PADEL') !== (item.sport ?? sport ?? 'PADEL'))
      reason = 'Olahraga tidak sesuai paket';
    else if (
      !isTimeAllowedForMembershipType(membership.membership.type ?? 'ALL_HOUR', item.timeSlot)
    )
      reason = 'Jam di luar ketentuan paket';
    if (reason) reasons[item.slotId] = reason;
    return !reason;
  });
  const selected = new Set<string>();
  let hours = 0;
  const limit = membership?.remainingSessions ?? 0;
  // Allocate defaults chronologically; an explicit choice always wins over defaults.
  for (const item of [...eligible].sort((a, b) =>
    `${a.date} ${a.timeSlot} ${a.slotId}`.localeCompare(`${b.date} ${b.timeSlot} ${b.slotId}`)
  )) {
    if (requestedIds && !requestedIds.includes(item.slotId)) continue;
    const next = hours + bookingHours(item);
    if (Math.ceil(next) <= limit) {
      selected.add(item.slotId);
      hours = next;
    }
  }
  for (const item of eligible) {
    if (!selected.has(item.slotId) && Math.ceil(hours + bookingHours(item)) > limit) {
      reasons[item.slotId] = 'Sisa sesi tidak mencukupi';
    }
  }
  let originalTotal = 0;
  let discountAmount = 0;
  for (const item of items) {
    const normal = item.normalPrice ?? item.price;
    const effective = (item.discountPrice ?? 0) > 0 ? item.discountPrice! : item.price;
    originalTotal += selected.has(item.slotId) ? normal : effective;
    if (selected.has(item.slotId)) discountAmount += normal;
  }
  return {
    membershipSlotIds: [...selected],
    membershipSlotReasons: reasons,
    canUseMembership: selected.size > 0,
    slotsToDeduct: Math.ceil(hours),
    originalTotal,
    discountAmount,
    discountedTotal: originalTotal - discountAmount
  };
}
