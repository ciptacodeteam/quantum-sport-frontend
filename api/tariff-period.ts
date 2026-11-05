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
  try {
    const { data } = await adminApi.put('/tariff-periods', input, { timeout: 75000 });
    return data.data;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
    ) {
      throw new Error(
        'Penyimpanan melewati batas waktu. Muat ulang aturan untuk memeriksa hasilnya sebelum mencoba lagi.'
      );
    }
    throw error;
  }
}
