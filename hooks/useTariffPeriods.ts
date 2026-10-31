'use client';
import { useQuery } from '@tanstack/react-query';
import { getTariffPeriods } from '@/api/tariff-period';
import { useBranchStore } from '@/stores/useBranchStore';
import useAuthStore from '@/stores/useAuthStore';
import type { TariffRule } from '@/lib/tariff-period';
const emptyRules: TariffRule[] = [];
export function useTariffPeriods(admin = false) {
  const user = useAuthStore((state) => state.user) as { role?: string; branchId?: string } | null;
  const branch = useBranchStore((state) => state.branch);
  const adminBranchId = useBranchStore((state) => state.adminBranchId);
  const branchId = admin
    ? user?.role === 'SUPER_ADMIN'
      ? adminBranchId
      : user?.branchId
    : branch?.id;
  const query = useQuery({
    queryKey: ['tariff-periods', admin ? 'admin' : 'client', branchId],
    queryFn: () => getTariffPeriods(admin),
    enabled: !!branchId,
    staleTime: 30_000
  });
  return { ...query, branchId, rules: query.data?.rules ?? emptyRules };
}
