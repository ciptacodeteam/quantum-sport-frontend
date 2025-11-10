import { Suspense } from 'react';
import ActivitiesContent from './activities-content';

function ActivitiesLoadingFallback() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="text-muted-foreground">Loading pemesanan...</div>
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<ActivitiesLoadingFallback />}>
      <ActivitiesContent />
    </Suspense>
  );
}

