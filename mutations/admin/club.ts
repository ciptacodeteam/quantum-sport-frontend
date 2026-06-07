import { approveAdminClubApi, deleteAdminClubApi } from '@/api/admin/club';
import { handleMutationError } from '@/lib/handle-mutation-error';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const deleteAdminClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: deleteAdminClubApi,
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Club deleted successfully!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to delete club. Please try again.'
      })
  });

export const approveAdminClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: approveAdminClubApi,
    onSuccess: (data) => {
      const successMsg = data?.message || data?.msg || 'Club approved successfully!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to approve club. Please try again.'
      })
  });
