import {
  createStaffApi,
  resetStaffPasswordApi,
  revokeStaffSessionApi,
  updateStaffApi
} from '@/api/admin/staff';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const adminCreateStaffMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createStaffApi,
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

export const adminUpdateStaffMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateStaffApi,
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

export const adminResetStaffPasswordMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: resetStaffPasswordApi,
    onSuccess: (data) => {
      toast.success('Password berhasil direset!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal mereset password. Silakan coba lagi.');
      onError?.(error);
    }
  });

export const adminRevokeStaffSessionMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: revokeStaffSessionApi,
    onSuccess: (data) => {
      toast.success('Session berhasil dicabut!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal mencabut session. Silakan coba lagi.');
      onError?.(error);
    }
  });
