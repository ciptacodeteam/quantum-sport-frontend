import { expect, it } from 'vitest';
import { getCourtSlotLabel } from './court-slot-status';
it('shows the explicit booking state and never assumes an unavailable slot is booked', () => {
  expect(getCourtSlotLabel({ isAvailable: false, availabilityStatus: 'ON_HOLD' })).toBe('On Hold');
  expect(getCourtSlotLabel({ isAvailable: false, availabilityStatus: 'BOOKED' })).toBe('Booked');
  expect(getCourtSlotLabel({ isAvailable: false })).toBe('Unavailable');
  expect(getCourtSlotLabel()).toBe('Unavailable');
  expect(getCourtSlotLabel({ isAvailable: true })).toBe('Available');
});
