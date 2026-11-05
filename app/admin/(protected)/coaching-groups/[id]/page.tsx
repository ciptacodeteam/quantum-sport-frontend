import { Suspense } from 'react';
import CoachingGroupDetail from '@/components/admin/coaching/CoachingGroupDetail';

export default async function CoachingGroupDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p>Memuat...</p>}>
      <CoachingGroupDetail groupId={id} />
    </Suspense>
  );
}
