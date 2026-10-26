import type {
  BookingItem,
  SelectedBallboy,
  SelectedCoach,
  SelectedInventory
} from '@/stores/useBookingStore';

type CartSelections = {
  bookingItems: BookingItem[];
  selectedCoaches: SelectedCoach[];
  selectedBallboys: SelectedBallboy[];
  selectedInventories: SelectedInventory[];
};

export function getCheckoutSelections({
  bookingItems,
  selectedCoaches,
  selectedBallboys,
  selectedInventories
}: CartSelections) {
  const courtSlots = bookingItems
    .filter((item) => item.slotId && !/-\d{2}:\d{2}$/.test(item.slotId))
    .map((item) => item.slotId);
  const coachSlots = selectedCoaches.filter((coach) => coach.slotId).map((coach) => coach.slotId);
  const ballboySlots = selectedBallboys
    .filter((ballboy) => ballboy.slotId && ballboy.courtSlotId)
    .map((ballboy) => ({
      slotId: ballboy.slotId as string,
      courtSlotId: ballboy.courtSlotId as string
    }));
  const inventories = selectedInventories
    .filter((item) => item.inventoryId && item.quantity > 0)
    .map((item) => ({
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      ...(item.courtSlotId && courtSlots.includes(item.courtSlotId)
        ? { courtSlotId: item.courtSlotId }
        : {})
    }));
  return { courtSlots, coachSlots, ballboySlots, inventories };
}
