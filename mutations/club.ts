import { joinClubApi, requestJoinClubApi, leaveClubApi, createClubApi } from '@/api/club';
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
      toast.error(errorMsg);
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
