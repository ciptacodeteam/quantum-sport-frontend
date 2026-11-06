export type BookingPurpose = 'REGULAR' | 'COACH_TRAINING' | 'EVENT';

export function bookingPurposeLabel(purpose?: BookingPurpose): string {
  if (purpose === 'COACH_TRAINING') return 'Training Coach';
  if (purpose === 'EVENT') return 'Event';
  return 'Reguler';
}

export function isInternalBooking(booking: { purpose?: BookingPurpose }): boolean {
  return booking.purpose === 'COACH_TRAINING' || booking.purpose === 'EVENT';
}
