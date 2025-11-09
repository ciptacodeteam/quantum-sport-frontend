import { createBookingApi, checkoutApi } from '@/api/booking';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const createBookingMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
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

export const checkoutMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: checkoutApi,
    onSuccess: (data) => {
      toast.success('Checkout berhasil!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || error.message || 'Gagal melakukan checkout. Silakan coba lagi.');
      onError?.(error);
    }
  });

