import { adminApi } from '@/lib/adminApi';
import type { MembershipTracking, TrackedPackage } from '@/types/membership-tracking';

export type MemberContact = { name: string; phone: string | null; email: string | null };
export type MembershipMember = {
  id: string;
  user: MemberContact;
  membership: {
    name: string;
    sport: 'PADEL' | 'TENNIS';
    type: TrackedPackage['type'];
    sessions: number;
  };
  startDate: string;
  endDate: string;
  remainingSessions: number;
  status: TrackedPackage['status'];
};
export type MembershipMembers = {
  packages: MembershipMember[];
  total: number;
  page: number;
  pageSize: number;
};
export async function getMembershipMembers(
  params: { q: string; page: number; sport?: 'PADEL' | 'TENNIS' },
  signal?: AbortSignal
) {
  const { data } = await adminApi.get<{ data: MembershipMembers }>(
    '/analytics/membership-members',
    { params, signal }
  );
  return data.data;
}
export async function getMembershipMemberTracking(id: string, signal?: AbortSignal) {
  const { data } = await adminApi.get<{ data: MembershipTracking & { user: MemberContact } }>(
    `/analytics/membership-members/${id}`,
    { signal }
  );
  return data.data;
}
