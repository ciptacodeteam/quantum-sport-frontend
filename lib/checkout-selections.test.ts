import { describe, expect, it } from 'vitest';
import { getCheckoutSelections } from './checkout-selections';
import type { BookingItem, SelectedInventory } from '@/stores/useBookingStore';

const equipment: SelectedInventory = {
  inventoryId: 'racket',
  inventoryName: 'Racket',
  quantity: 2,
  price: 100000,
  timeSlot: 'default'
};
const court: BookingItem = {
  slotId: 'slot-1',
  courtId: 'court-1',
  courtName: 'Court 1',
  timeSlot: '10:00',
  endTime: '11:00',
  date: '2030-10-22',
  price: 100000
};
const empty = {
  bookingItems: [],
  selectedCoaches: [],
  selectedBallboys: [],
  selectedInventories: []
};

describe('checkout item payloads', () => {
  it('sends equipment quantities without inventing a court slot', () => {
    expect(getCheckoutSelections({ ...empty, selectedInventories: [equipment] })).toEqual({
      courtSlots: [],
      coachSlots: [],
      ballboySlots: [],
      inventories: [{ inventoryId: 'racket', quantity: 2 }]
    });
  });
  it('retains the court reference for scheduled equipment', () => {
    expect(
      getCheckoutSelections({
        ...empty,
        bookingItems: [court],
        selectedInventories: [{ ...equipment, courtSlotId: 'slot-1' }]
      }).inventories
    ).toEqual([{ inventoryId: 'racket', quantity: 2, courtSlotId: 'slot-1' }]);
  });
  it('allows remaining equipment to be purchased independently after its court was removed', () => {
    expect(
      getCheckoutSelections({
        ...empty,
        selectedInventories: [{ ...equipment, courtSlotId: 'removed-slot' }]
      }).inventories
    ).toEqual([{ inventoryId: 'racket', quantity: 2 }]);
  });
});

it('sends standalone ballboy IDs without inventing a court reference', () => {
  const ballboy = {
    ballboyId: 'ballboy',
    ballboyName: 'Budi',
    slotId: 'ballboy-slot',
    date: '2030-10-23',
    timeSlot: '08:00 - 09:00',
    price: 45000
  };
  expect(getCheckoutSelections({ ...empty, selectedBallboys: [ballboy] }).ballboySlots).toEqual([
    'ballboy-slot'
  ]);
  expect(
    getCheckoutSelections({
      ...empty,
      bookingItems: [court],
      selectedBallboys: [{ ...ballboy, courtSlotId: 'slot-1' }]
    }).ballboySlots
  ).toEqual([{ slotId: 'ballboy-slot', courtSlotId: 'slot-1' }]);
});
