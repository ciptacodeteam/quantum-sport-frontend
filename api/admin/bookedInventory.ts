import { adminApi } from '@/lib/adminApi';
import { mergedQueryParamUrl } from '@/lib/utils';
import type { SearchParamsData } from '@/types';

export async function getBookedInventoriesApi(queryParams: SearchParamsData = {}) {
	const url = '/booked-inventories';
	const mergedUrl = mergedQueryParamUrl(url, queryParams);
	const res = await adminApi.get(mergedUrl);
	return res.data;
}

export async function getBookedInventoryApi(id: string) {
	const { data } = await adminApi.get(`/booked-inventories/${id}`);
	return data;
}

export async function cancelBookedInventoryApi(id: string, reason?: string) {
	const { data } = await adminApi.put(`/booked-inventories/${id}/cancel`, { reason });
	return data;
}


