import { getBookedCoachApi, getBookedCoachesApi } from '@/api/admin/bookedCoach';
import { queryOptions } from '@tanstack/react-query';
import type { SearchParamsData } from '@/types';

export type AdminBookedCoachListItem = {
	id: string;
	coach: {
		id: string;
		staff: { id: string; name: string; phone?: string | null } | null;
		coachType?: string | { id: string; name: string } | null;
		price?: number | null;
	} | null;
	slot?: {
		id?: string;
		startAt: string;
		endAt: string;
		date?: string;
		startTime?: string;
		endTime?: string;
	} | null;
	booking: {
		id: string;
		status: string;
		totalPrice?: number;
		customer?:
			| {
					id: string;
					name: string;
					email?: string;
					phone?: string | null;
					image?: string | null;
			  }
			| null;
		invoice?:
			| {
					id: string;
					number: string;
					status: string;
					total?: number;
			  }
			| null;
		courtSlots?: Array<{
			court: { id: string; name: string } | null;
			startAt: string;
			endAt: string;
			date: string;
			time: string;
		}>;
		createdAt?: string;
	};
	createdAt: string;
	updatedAt?: string;
};

export type AdminBookedCoachDetail = AdminBookedCoachListItem & {
	booking: AdminBookedCoachListItem['booking'] & {
		details?: Array<{
			id: string;
			court?: { id: string; name: string } | null;
			slot?: {
				id: string;
				startAt: string;
				endAt: string;
				date: string;
				startTime: string;
				endTime: string;
			} | null;
			price?: number;
		}>;
		invoice?:
			| (NonNullable<AdminBookedCoachListItem['booking']['invoice']> & {
					payment?: { method?: string | { name?: string } | null } | null;
			  })
			| null;
	};
};

export const adminBookedCoachesQueryOptions = (queryParams?: SearchParamsData) =>
	queryOptions({
		queryKey: ['admin', 'booked-coaches', queryParams],
		queryFn: () => getBookedCoachesApi(queryParams),
		select: (res) => res.data as AdminBookedCoachListItem[]
	});

export const adminBookedCoachQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ['admin', 'booked-coaches', id],
		queryFn: () => getBookedCoachApi(id),
		select: (res) => res.data as AdminBookedCoachDetail
	});


