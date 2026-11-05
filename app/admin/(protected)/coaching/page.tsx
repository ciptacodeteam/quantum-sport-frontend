import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import CoachingCatalog from '@/components/admin/coaching/CoachingCatalog';
export default async function CoachingPage({
  searchParams
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  if (kind !== 'BALLBOY') redirect('/admin/coaching-groups');
  return (
    <Suspense fallback={<p>Memuat...</p>}>
      <CoachingCatalog />
    </Suspense>
  );
}
