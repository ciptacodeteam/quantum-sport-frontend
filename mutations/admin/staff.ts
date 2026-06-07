import {
  createStaffApi,
  createStaffCostApi,
  resetStaffPasswordApi,
  revokeStaffSessionApi,
  updateStaffApi
} from '@/api/admin/staff';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const adminCreateStaffMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createStaffApi,
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

export const adminUpdateStaffMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateStaffApi,
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
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal mereset password. Silakan coba lagi.'
      })
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
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal mencabut session. Silakan coba lagi.'
      })
  });

export const adminCreateStaffCostMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createStaffCostApi,
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
