import { Suspense } from 'react';
import AddOnsContent from './add-ons-content';

function AddOnsLoadingFallback() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="text-muted-foreground">Loading add-ons...</div>
    </div>
  );
}

export default function AddOnsPage() {
  return (
    <Suspense fallback={<AddOnsLoadingFallback />}>
      <AddOnsContent />
    </Suspense>
  );
}
