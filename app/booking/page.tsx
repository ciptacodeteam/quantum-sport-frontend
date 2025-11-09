import { Suspense } from 'react';
import BookingContent from './booking-content';

function BookingLoadingFallback() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="text-muted-foreground">Loading booking...</div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingLoadingFallback />}>
      <BookingContent />
    </Suspense>
  );
}
