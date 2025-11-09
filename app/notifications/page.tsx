import { Suspense } from 'react';
import NotificationContent from './notifications-content';

function NotificationLoadingFallback() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="text-muted-foreground">Loading notifications...</div>
    </div>
  );
}

export default function NotificationPage() {
  return (
    <Suspense fallback={<NotificationLoadingFallback />}>
      <NotificationContent />
    </Suspense>
  );
}
