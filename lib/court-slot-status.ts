type CalendarSlot = {
  isAvailable: boolean;
  availabilityStatus?: 'AVAILABLE' | 'ON_HOLD' | 'BOOKED' | 'UNAVAILABLE';
};
export function getCourtSlotLabel(slot?: CalendarSlot) {
  if (slot?.availabilityStatus === 'ON_HOLD') return 'On Hold';
  if (slot?.availabilityStatus === 'BOOKED') return 'Booked';
  return slot?.isAvailable ? 'Available' : 'Unavailable';
}
