import { createTournamentApi, updateTournamentApi } from '@/api/admin/tournament';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const adminCreateTournamentMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createTournamentApi,
    onSuccess: (data) => {
      toast.success('Turnamen berhasil dibuat!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal membuat turnamen. Silakan coba lagi.');
      onError?.(error);
    }
  });

export const adminUpdateTournamentMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateTournamentApi,
    onSuccess: (data) => {
      toast.success('Turnamen berhasil diperbarui!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal memperbarui turnamen. Silakan coba lagi.');
      onError?.(error);
    }
  });

