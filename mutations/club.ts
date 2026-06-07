import {
  joinClubApi,
  requestJoinClubApi,
  leaveClubApi,
  createClubApi,
  approveClubRequestApi,
  rejectClubRequestApi,
  deleteClubApi,
  removeMemberApi
} from '@/api/club';
import { getApiErrorMessage, isValidationError } from '@/lib/api-error';
import { handleMutationError } from '@/lib/handle-mutation-error';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const joinClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: joinClubApi,
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Berhasil bergabung dengan club!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal bergabung dengan club. Silakan coba lagi.'
      })
  });

export const requestJoinClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: requestJoinClubApi,
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Permintaan bergabung berhasil dikirim!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);

      if (isValidationError(error)) {
        onError?.(error);
        return;
      }

      const errorMsg = getApiErrorMessage(error, 'Gagal mengirim permintaan. Silakan coba lagi.');
      const errorLower = errorMsg.toLowerCase();
      const isAlreadyMemberError =
        errorLower.includes('already') ||
        errorLower.includes('sudah') ||
        errorLower.includes('telah bergabung') ||
        errorLower.includes('telah mengirim') ||
        errorLower.includes('pending');

      if (isAlreadyMemberError) {
        toast.warning(errorMsg);
      } else {
        toast.error(errorMsg);
      }

      onError?.(error);
    }
  });

export const leaveClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: leaveClubApi,
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Berhasil keluar dari club';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal keluar dari club. Silakan coba lagi.'
      })
  });

export const createClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createClubApi,
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Club berhasil dibuat!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal membuat club. Silakan coba lagi.'
      })
  });

export const approveClubRequestMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: ({ clubId, userId }: { clubId: string; userId: string }) =>
      approveClubRequestApi(clubId, userId),
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Request approved successfully!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to approve request. Please try again.'
      })
  });

export const rejectClubRequestMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: ({ clubId, userId }: { clubId: string; userId: string }) =>
      rejectClubRequestApi(clubId, userId),
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Request rejected successfully!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to reject request. Please try again.'
      })
  });

export const deleteClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: deleteClubApi,
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

export const removeMemberMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: ({ clubId, userId }: { clubId: string; userId: string }) =>
      removeMemberApi(clubId, userId),
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Member removed successfully!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to remove member. Please try again.'
      })
  });
