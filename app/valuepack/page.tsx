import { Suspense } from 'react';
import ValuePackContent from './valuepack-content';

function ValuePackLoadingFallback() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="text-muted-foreground">Loading value pack...</div>
    </div>
  );
}

export default function ValuePackPage() {
  return (
    <Suspense fallback={<ValuePackLoadingFallback />}>
      <ValuePackContent />
    </Suspense>
  );
}
