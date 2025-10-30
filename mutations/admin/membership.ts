import { createMembershipApi, updateMembershipApi } from '@/api/admin/membership';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const adminCreateMembershipMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createMembershipApi,
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

export const adminUpdateMembershipMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateMembershipApi,
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
