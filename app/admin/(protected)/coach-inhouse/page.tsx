import { Suspense } from 'react';
import CoachingCatalog from '@/components/admin/coaching/CoachingCatalog';
export default function InHouseCoachPage() {
  return (
    <Suspense fallback={<p>Memuat...</p>}>
      <CoachingCatalog inHouse />
    </Suspense>
  );
}
