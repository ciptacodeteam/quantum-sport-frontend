import {
  getCourtApi,
  getCourtsApi,
  getCourtSlotsApi,
  getCourtsSlotsApi,
  getCourtCostingApi
} from '@/api/admin/court';
import type { Court, Slot } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export const adminCourtsQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'courts', queryParams],
    queryFn: () => getCourtsApi(queryParams),
    select: (res) => res.data as Court[]
  });

export const adminCourtQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'courts', id],
    queryFn: () => getCourtApi(id),
    select: (res) => res.data as Court
  });

export const adminCourtCostingQueryOptions = (
  queryParams: SearchParamsData,
  branchId?: string | null
) =>
  queryOptions({
    queryKey: ['admin', 'court-costing', branchId ?? 'assigned', queryParams],
    queryFn: () => getCourtsSlotsApi(queryParams),
    select: (res) => res.data as (Slot & { court?: Court })[]
  });

export const adminCourtCostingQueryOptionsById = (id: string, queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'courts', id, 'costing', queryParams],
    queryFn: () => getCourtCostingApi(id, queryParams),
    select: (res) => res.data as { date: string; slots: Slot[] }[]
  });

// Query to get courts with available slots for a specific date (admin)
export const adminCourtsWithSlotsQueryOptions = (
  date: string,
  courtId?: string,
  courtSport?: 'PADEL' | 'TENNIS',
  includeUnavailable = false
) =>
  queryOptions({
    queryKey: ['admin', 'courts', 'slots', date, courtId, courtSport, includeUnavailable],
    queryFn: async () => {
      // Wall-clock day bounds (slots are stored as Jakarta wall in timestamp w/o tz)
      const startAt = `${date}T00:00:00.000Z`;
      const endAt = `${date}T23:59:59.999Z`;

      // Court catalog and daily slots are independent: start both immediately.
      // Settle both promises before attempting the per-court fallback.
      const [courtResult, slotResult] = await Promise.allSettled([
        getCourtsApi(courtSport ? { courtSport } : undefined),
        getCourtsSlotsApi({
          startAt,
          endAt,
          ...(courtId ? { courtId } : {}),
          ...(courtSport ? { courtSport } : {}),
          ...(includeUnavailable ? { includeUnavailable: 'true' } : {})
        })
      ]);
      if (courtResult.status === 'rejected') throw courtResult.reason;
      const courtsResponse = courtResult.value;
      let courts = courtsResponse.data as Court[];

      if (courtSport) {
        courts = courts.filter((c) => c.sport === courtSport);
      }

      // Filter by courtId if specified
      if (courtId) {
        courts = courts.filter((c) => c.id === courtId);
      }

      // Use the /courts/slots endpoint to get all slots at once (avoids 404s from individual court endpoints)
      let allSlots: Slot[] = [];
      try {
        if (slotResult.status === 'rejected') throw slotResult.reason;
        const slotsResponse = slotResult.value;
        allSlots = (slotsResponse.data || []) as Slot[];
      } catch (error) {
        // If the bulk endpoint fails, fall back to individual court endpoints
        console.warn(
          'Failed to fetch slots from /courts/slots, falling back to individual endpoints:',
          error
        );
        const slotPromises = courts.map(async (court) => {
          try {
            const slotsResponse = await getCourtSlotsApi(court.id, {
              startAt,
              endAt,
              ...(includeUnavailable ? { includeUnavailable: 'true' } : {})
            });
            return slotsResponse.data as Slot[];
          } catch {
            // If a court doesn't have slots endpoint or fails, return empty array
            return [] as Slot[];
          }
        });

        const slotsArrays = await Promise.all(slotPromises);
        courts.forEach((court, index) => {
          const slots = slotsArrays[index] || [];
          slots.forEach((slot) => {
            allSlots.push({
              ...slot,
              courtId: court.id
            });
          });
        });
      }

      // Filter slots by courtId if specified
      if (courtId) {
        allSlots = allSlots.filter((slot) => slot.courtId === courtId);
      }
      if (courtSport) {
        const courtIds = new Set(courts.map((court) => court.id));
        allSlots = allSlots.filter((slot) => {
          const slotCourtSport = (slot as Slot & { court?: Court }).court?.sport;
          return slotCourtSport
            ? slotCourtSport === courtSport
            : Boolean(slot.courtId && courtIds.has(slot.courtId));
        });
      }

      return {
        courts,
        slots: allSlots
      };
    },
    enabled: !!date
  });
