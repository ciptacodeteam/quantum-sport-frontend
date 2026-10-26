import { api } from '@/lib/api';
import { adminApi } from '@/lib/adminApi';
import type { Branch } from '@/types/branch';
export async function getBranches(): Promise<Branch[]> {
  const { data } = await api.get('/branches');
  return data.data;
}
export async function getAdminBranches(): Promise<Branch[]> {
  const { data } = await adminApi.get('/branches');
  return data.data;
}
