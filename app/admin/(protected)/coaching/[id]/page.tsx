'use client';
import { useParams, useSearchParams } from 'next/navigation';
import CoachingSchedule from '@/components/admin/coaching/CoachingSchedule';
export default function CoachingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = useSearchParams().get('groupId') || undefined;
  return <CoachingSchedule staffId={id} groupId={groupId} key={id} />;
}
