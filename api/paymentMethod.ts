import { api } from '@/lib/api';

export async function getPaymentMethodsApi() {
  const { data } = await api.get('/payment-methods');
  return data;
}
