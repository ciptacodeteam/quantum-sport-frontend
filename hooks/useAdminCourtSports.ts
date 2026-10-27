'use client';
import { useQuery } from '@tanstack/react-query';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { useBranchStore } from '@/stores/useBranchStore';
import { branchSupportsTennis } from '@/lib/court-branch-policy';
export function useAdminCourtSports() {
  const { data: user } = useQuery(adminProfileQueryOptions);
  const selected = useBranchStore((state) => state.adminBranchId);
  const branchId = user?.role === 'SUPER_ADMIN' ? selected : user?.branchId;
  return { branchId, canCreateTennis: branchSupportsTennis(branchId) };
}
