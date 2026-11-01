'use client';
import { useParams } from 'next/navigation';
import CoachingSchedule from '@/components/admin/coaching/CoachingSchedule';
export default function CoachingDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <CoachingSchedule staffId={id} key={id} />;
}
