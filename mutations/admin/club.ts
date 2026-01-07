import { approveAdminClubApi, deleteAdminClubApi } from '@/api/admin/club';
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
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg =
        error?.response?.data?.msg ||
        error?.msg ||
        error?.message ||
        'Failed to delete club. Please try again.';
      toast.error(errorMsg);
      onError?.(error);
    }
  });

export const approveAdminClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: approveAdminClubApi,
    onSuccess: (data) => {
      const successMsg = data?.message || data?.msg || 'Club approved successfully!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg =
        error?.response?.data?.msg ||
        error?.msg ||
        error?.message ||
        'Failed to approve club. Please try again.';
      toast.error(errorMsg);
      onError?.(error);
    }
  });
