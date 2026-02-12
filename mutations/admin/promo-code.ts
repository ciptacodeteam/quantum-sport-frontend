import { createPromoCodeApi, updatePromoCodeApi } from '@/api/admin/promo-code';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const adminCreatePromoCodeMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createPromoCodeApi,
    onSuccess: (data) => {
      toast.success('Data berhasil disimpan!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal menyimpan data. Silakan coba lagi.');
      onError?.(error);
    }
  });

export const adminUpdatePromoCodeMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updatePromoCodeApi,
    onSuccess: (data) => {
      toast.success('Data berhasil diperbarui!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal memperbarui data. Silakan coba lagi.');
      onError?.(error);
    }
  });
