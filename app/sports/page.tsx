import { Suspense } from 'react';
import HistoryContent from './history-content';

function HistoryLoadingFallback() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="text-muted-foreground">Loading riwayat...</div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryLoadingFallback />}>
      <HistoryContent />
    </Suspense>
  );
}

