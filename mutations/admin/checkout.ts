import { adminCheckoutApi, type AdminCheckoutPayload } from '@/api/admin/checkout';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const adminCheckoutMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: (payload: AdminCheckoutPayload) => adminCheckoutApi(payload),
    onSuccess: (data) => {
      toast.success('Pemesanan berhasil dikonfirmasi!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal mengonfirmasi pemesanan. Silakan coba lagi.');
      onError?.(error);
    }
  });


