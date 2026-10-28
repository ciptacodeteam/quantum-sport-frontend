import { expect, it } from 'vitest';
import type { AdminBookedInventoryListItem } from '@/queries/admin/bookedInventory';
import { hasAmount, hasText, itemSchedules, scheduleTime } from './booked-inventory-display';
const slot = (hour: number) => ({
  startAt: `2040-01-05T0${hour}:00:00Z`,
  endAt: `2040-01-05T0${hour + 1}:00:00Z`,
  court: { id: 'court', name: 'Padel 1' }
});
const item = {
  booking: { courtSlots: [slot(2), slot(3)] },
  slot: slot(3)
} as unknown as AdminBookedInventoryListItem;
it('shows the specific inventory session instead of repeating the first booking slot', () => {
  const schedules = itemSchedules(item);
  expect(schedules).toHaveLength(1);
  expect(scheduleTime(schedules[0])).toBe('10:00–11:00 WIB');
  expect(schedules[0].court).toBe('Padel 1');
});
it('infers the service court only from overlapping sessions', () => {
  const schedules = itemSchedules({ ...item, slot: { ...slot(3), court: null } });
  expect(schedules[0].court).toBe('Padel 1');
  expect(scheduleTime(schedules[0])).toBe('10:00–11:00 WIB');
});
it('keeps legacy nested schedules and omits missing or invalid schedules', () => {
  const legacy = {
    ...item,
    slot: null,
    booking: { ...item.booking, courtSlots: [] },
    courtSlots: [{ court: { id: 'court', name: 'Padel 1' }, slot: slot(2) }]
  };
  expect(scheduleTime(itemSchedules(legacy)[0])).toBe('09:00–10:00 WIB');
  expect(
    itemSchedules({ ...item, slot: null, booking: { ...item.booking, courtSlots: [] } })
  ).toEqual([]);
  expect(itemSchedules({ ...item, slot: { startAt: 'invalid', endAt: 'invalid' } })).toEqual([]);
});
it('hides missing text but preserves actual zero quantities and zero prices', () => {
  expect(hasText(null)).toBe(false);
  expect(hasText('  ')).toBe(false);
  expect(hasText('N/A')).toBe(false);
  expect(hasAmount(0)).toBe(true);
  expect(hasAmount(null)).toBe(false);
});
