import { createInventoryApi, deleteInventoryApi, updateInventoryApi } from '@/api/admin/inventory';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
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
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal menyimpan data. Silakan coba lagi.');
      onError?.(error);
    }
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
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal memperbarui data. Silakan coba lagi.');
      onError?.(error);
    }
  });
