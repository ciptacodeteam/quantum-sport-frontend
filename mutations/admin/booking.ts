import { createBookingApi } from '@/api/admin/booking';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const adminCreateBookingMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createBookingApi,
    onSuccess: (data) => {
      toast.success('Pemesanan berhasil dibuat!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal membuat pemesanan. Silakan coba lagi.');
      onError?.(error);
    }
  });
