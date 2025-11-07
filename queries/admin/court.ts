import { getCourtApi, getCourtCostingApi, getCourtsApi, getCourtSlotsApi } from '@/api/admin/court';
import type { Court, Slot } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';
import dayjs from 'dayjs';
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

export const adminCourtCostingQueryOptions = (id: string, queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['admin', 'courts', id, 'costing', queryParams],
    queryFn: () => getCourtCostingApi(id, queryParams),
    select: (res) => res.data as { date: string; slots: Slot[] }[]
  });

// Query to get courts with available slots for a specific date (admin)
export const adminCourtsWithSlotsQueryOptions = (date: string, courtId?: string) =>
  queryOptions({
    queryKey: ['admin', 'courts', 'slots', date, courtId],
    queryFn: async () => {
      // Get slots for the entire day (06:00 to 23:00)
      // API expects ISO format: 2025-01-20T08:00:00
      const startAt = dayjs(date).startOf('day').add(6, 'hour').toISOString();
      const endAt = dayjs(date).startOf('day').add(23, 'hour').toISOString();
      
      // First, fetch all courts (don't filter by availability)
      const courtsResponse = await getCourtsApi();
      let courts = courtsResponse.data as Court[];
      
      // Filter by courtId if specified
      if (courtId) {
        courts = courts.filter(c => c.id === courtId);
      }
      
      // Then fetch slots for each court in parallel
      const slotPromises = courts.map(async (court) => {
        try {
          const slotsResponse = await getCourtSlotsApi(court.id, { startAt, endAt });
          return slotsResponse.data as Slot[];
        } catch (error) {
          // If a court doesn't have slots endpoint or fails, return empty array
          return [] as Slot[];
        }
      });
      
      const slotsArrays = await Promise.all(slotPromises);
      
      // Flatten all slots and ensure courtId is set
      const allSlots: Slot[] = [];
      courts.forEach((court, index) => {
        const slots = slotsArrays[index] || [];
        slots.forEach((slot) => {
          allSlots.push({
            ...slot,
            courtId: court.id
          });
        });
      });

      return {
        courts,
        slots: allSlots
      };
    },
    enabled: !!date
  });
