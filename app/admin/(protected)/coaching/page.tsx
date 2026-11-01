import { Suspense } from 'react';
import CoachingCatalog from '@/components/admin/coaching/CoachingCatalog';
export default function CoachingPage() {
  return (
    <Suspense fallback={<p>Memuat...</p>}>
      <CoachingCatalog />
    </Suspense>
  );
}
