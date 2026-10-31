import { api } from '@/lib/api';
import { adminApi } from '@/lib/adminApi';
import type { TariffPeriodInput, TariffPeriodResponse } from '@/lib/tariff-period';
export async function getTariffPeriods(admin = false): Promise<TariffPeriodResponse> {
  const { data } = admin
    ? await adminApi.get('/tariff-periods')
    : await api.get('/courts/tariff-periods');
  return data.data;
}
export async function saveTariffPeriod(input: TariffPeriodInput) {
  const { data } = await adminApi.put('/tariff-periods', input);
  return data.data;
}
