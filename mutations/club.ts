import { joinClubApi, requestJoinClubApi, leaveClubApi, createClubApi, approveClubRequestApi, rejectClubRequestApi, deleteClubApi } from '@/api/club';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const joinClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: joinClubApi,
    onSuccess: (data) => {
      // Extract success message from backend response
      const successMsg = data?.msg || 'Berhasil bergabung dengan club!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || 'Gagal bergabung dengan club. Silakan coba lagi.';
      toast.error(errorMsg);
      onError?.(error);
    }
  });

export const requestJoinClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: requestJoinClubApi,
    onSuccess: (data) => {
      // Extract success message from backend response
      const successMsg = data?.msg || 'Permintaan bergabung berhasil dikirim!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || 'Gagal mengirim permintaan. Silakan coba lagi.';
      
      // Check if error is about already being in a club or already requested
      const errorLower = errorMsg.toLowerCase();
      const isAlreadyMemberError = errorLower.includes('already') || 
                                   errorLower.includes('sudah') || 
                                   errorLower.includes('telah bergabung') ||
                                   errorLower.includes('telah mengirim') ||
                                   errorLower.includes('pending');
      
      // Show warning toast for membership conflicts, error toast for other errors
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
      // Extract success message from backend response
      const successMsg = data?.msg || 'Berhasil keluar dari club';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || 'Gagal keluar dari club. Silakan coba lagi.';
      toast.error(errorMsg);
      onError?.(error);
    }
  });

export const createClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createClubApi,
    onSuccess: (data) => {
      // Extract success message from backend response
      const successMsg = data?.msg || 'Club berhasil dibuat!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || 'Gagal membuat club. Silakan coba lagi.';
      toast.error(errorMsg);
      onError?.(error);
    }
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
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || 'Failed to approve request. Please try again.';
      toast.error(errorMsg);
      onError?.(error);
    }
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
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || 'Failed to reject request. Please try again.';
      toast.error(errorMsg);
      onError?.(error);
    }
  });

export const deleteClubMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: deleteClubApi,
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Club deleted successfully!';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg = error?.response?.data?.msg || error?.msg || error?.message || 'Failed to delete club. Please try again.';
      toast.error(errorMsg);
      onError?.(error);
    }
  });
