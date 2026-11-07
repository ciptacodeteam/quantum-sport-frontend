import { parseScheduleDatetime } from './admin-schedule-time';
import type { BallboyAvailability } from '@/types/model';
import type { BookingItem, SelectedBallboy } from '@/stores/useBookingStore';

export function availableBallboyHours(options: BallboyAvailability[], date: string, now: number) {
  return options.filter((option) => {
    const start = parseScheduleDatetime(option.startAt);
    const end = parseScheduleDatetime(option.endAt);
    return (
      start.format('YYYY-MM-DD') === date &&
      start.minute() === 0 &&
      end.diff(start, 'minute') === 60 &&
      start.valueOf() > now
    );
  });
}

export function ballboyCartItem(option: BallboyAvailability): SelectedBallboy {
  const start = parseScheduleDatetime(option.startAt);
  const end = parseScheduleDatetime(option.endAt);
  return {
    ballboyId: option.ballboy.id,
    ballboyName: option.ballboy.name,
    slotId: option.slotId,
    price: option.price,
    date: start.format('YYYY-MM-DD'),
    timeSlot: `${start.format('HH:mm')} - ${end.format('HH:mm')}`,
    startAt: option.startAt,
    endAt: option.endAt,
    courtSport: 'TENNIS'
  };
}

export function courtBallboyRange(court: BookingItem) {
  const start = parseScheduleDatetime(
    court.startAt ?? `${court.date}T${court.timeSlot.slice(0, 5)}:00`
  );
  const endTime = court.endTime || court.timeSlot.split(' - ')[1];
  let end = court.endAt
    ? parseScheduleDatetime(court.endAt)
    : endTime
      ? parseScheduleDatetime(`${court.date}T${endTime}:00`)
      : start.add(1, 'hour');
  if (end.valueOf() <= start.valueOf()) end = end.add(1, 'day');
  return { startAt: start.format('YYYY-MM-DDTHH:mm:ss'), endAt: end.format('YYYY-MM-DDTHH:mm:ss') };
}

export function ballboyMatchesCourt(item: SelectedBallboy, court: BookingItem) {
  if (court.sport !== 'TENNIS' || item.courtSlotId !== court.slotId || !item.startAt || !item.endAt)
    return false;
  const range = courtBallboyRange(court);
  return (
    parseScheduleDatetime(item.startAt).valueOf() ===
      parseScheduleDatetime(range.startAt).valueOf() &&
    parseScheduleDatetime(item.endAt).valueOf() === parseScheduleDatetime(range.endAt).valueOf()
  );
}
