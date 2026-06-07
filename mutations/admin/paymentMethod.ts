import { createPaymentMethodApi, updatePaymentMethodApi } from '@/api/admin/paymentMethod';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const adminCreatePaymentMethodMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createPaymentMethodApi,
    onSuccess: (data) => {
      toast.success('Data berhasil disimpan!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal menyimpan data. Silakan coba lagi.'
      })
  });

export const adminUpdatePaymentMethodMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updatePaymentMethodApi,
    onSuccess: (data) => {
      toast.success('Data berhasil diperbarui!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal memperbarui data. Silakan coba lagi.'
      })
  });
