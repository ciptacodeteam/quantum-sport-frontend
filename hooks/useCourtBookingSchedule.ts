'use client';

import { useQuery } from '@tanstack/react-query';
import { getCourtBookingWindowApi } from '@/api/court';
import { courtsSlotsQueryOptions } from '@/queries/court';
import { useBranchStore } from '@/stores/useBranchStore';

export function useCourtBookingSchedule(date: string, today: string, sport: 'PADEL' | 'TENNIS') {
  const branchId = useBranchStore((state) => state.branch?.id);
  const windowQuery = useQuery({
    queryKey: ['courts', 'booking-window', branchId, sport],
    queryFn: () => getCourtBookingWindowApi(sport),
    enabled: !!branchId,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true
  });
  const withinWindow = !!windowQuery.data && date >= today && date <= windowQuery.data.endDate;
  const params = {
    startAt: `${date} 00:00:00`,
    endAt: `${date} 23:59:59`,
    courtSport: sport,
    includeUnavailable: 'true'
  };
  // The slots endpoint enforces the horizon itself. Fetch in parallel with the
  // window, while the page still waits for that window before enabling booking.
  const slotQuery = useQuery({
    ...courtsSlotsQueryOptions(params),
    queryKey: ['courts', 'slots', branchId ?? 'no-branch', params],
    enabled: !!branchId && date >= today && (!windowQuery.data || withinWindow),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true
  });
  return { windowQuery, slotQuery, withinWindow };
}
