import type { BookingBallboy, BookingDetail } from '@/types/model';
import dayjs from 'dayjs';

type CourtSlotLike = {
  court?: { name?: string | null } | null;
  slot?: { startAt?: string | Date | null; endAt?: string | Date | null } | null;
};

export function getCourtNameForSlot(
  slot: { startAt?: string | Date | null; endAt?: string | Date | null } | undefined,
  courtSlots?: CourtSlotLike[]
): string | undefined {
  if (!slot?.startAt || !slot?.endAt || !courtSlots?.length) {
    return undefined;
  }

  const slotStart = dayjs(slot.startAt);
  const slotEnd = dayjs(slot.endAt);

  const matchingCourts = courtSlots.filter((courtSlot) => {
    if (!courtSlot.slot?.startAt || !courtSlot.slot?.endAt) return false;

    const courtStart = dayjs(courtSlot.slot.startAt);
    const courtEnd = dayjs(courtSlot.slot.endAt);

    return slotStart.valueOf() <= courtStart.valueOf() && slotEnd.valueOf() >= courtEnd.valueOf();
  });

  const names = [
    ...new Set(matchingCourts.map((courtSlot) => courtSlot.court?.name).filter(Boolean))
  ] as string[];

  return names.length > 0 ? names.join(', ') : undefined;
}

export function getBallboyNames(ballboys: BookingBallboy[] | undefined): string[] {
  if (!ballboys?.length) return [];

  return ballboys
    .map((ballboy) => ballboy.slot?.staff?.name)
    .filter((name): name is string => Boolean(name));
}

export function getBallboyCourtName(
  ballboy: BookingBallboy,
  details?: BookingDetail[]
): string | undefined {
  if (ballboy.courtSlot?.court?.name) {
    return ballboy.courtSlot.court.name;
  }

  return getCourtNameForSlot(ballboy.slot, details);
}

export function formatBallboyBadgeLabel(names: string[]): string | null {
  if (names.length === 0) return null;

  const display =
    names.length === 1 ? names[0] : `${names[0]}${names.length > 1 ? ` +${names.length - 1}` : ''}`;

  return `Ballboy: ${display}`;
}
