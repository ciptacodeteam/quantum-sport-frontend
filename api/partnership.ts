import { api } from '@/lib/api';

export async function getPartnershipsApi() {
  const { data } = await api.get('/partnerships');
  return data;
}
