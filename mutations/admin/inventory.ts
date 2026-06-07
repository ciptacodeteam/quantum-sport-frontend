import { createInventoryApi, updateInventoryApi } from '@/api/admin/inventory';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const adminCreateInventoryMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createInventoryApi,
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

export const adminUpdateInventoryMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateInventoryApi,
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
