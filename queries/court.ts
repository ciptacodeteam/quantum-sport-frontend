import { getCourtApi, getCourtsApi, getCourtSlotsApi, getCourtsSlotsApi } from '@/api/court';
import type { Court, Slot } from '@/types/model';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';
import dayjs from 'dayjs';

export const courtsQueryOptions = (queryParams?: SearchParamsData) =>
  queryOptions({
    queryKey: ['courts', queryParams],
    queryFn: () => getCourtsApi(queryParams),
    select: (res) => res.data as Court[]
  });

export const courtQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['courts', id],
    queryFn: () => getCourtApi(id),
    select: (res) => res.data as Court
  });

export const courtsSlotsQueryOptions = (queryParams: SearchParamsData) =>
  queryOptions({
    queryKey: ['courts', 'slots', queryParams],
    queryFn: () => getCourtsSlotsApi(queryParams),
    select: (res) => res.data as (Slot & { court?: Court })[]
  });

// Query to get courts with available slots for a specific date
export const courtsWithSlotsQueryOptions = (date: string) =>
  queryOptions({
    queryKey: ['courts', 'slots', date],
    queryFn: async () => {
      // Get the full playing day so configurable tariff bands can include midnight hours
      // API expects ISO format: 2025-01-20T08:00:00
      const startAt = dayjs(date).startOf('day').toISOString();
      const endAt = dayjs(date).endOf('day').toISOString();

      // First, fetch courts filtered by date (only courts with available slots)
      const courtsResponse = await getCourtsApi({ startAt, endAt });
      const courts = courtsResponse.data as Court[];

      // Then fetch slots for each court in parallel
      const slotPromises = courts.map(async (court) => {
        const slotsResponse = await getCourtSlotsApi(court.id, { startAt, endAt });
        return slotsResponse.data as Slot[];
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
