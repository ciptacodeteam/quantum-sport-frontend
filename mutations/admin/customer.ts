import {
  banCustomerApi,
  createCustomerApi,
  sendResetPasswordLinkApi,
  unbanCustomerApi,
  updateCustomerApi
} from '@/api/admin/customer';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const adminCreateCustomerMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createCustomerApi,
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

export const adminUpdateCustomerMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateCustomerApi,
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

export const adminBanCustomerMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: banCustomerApi,
    onSuccess: (data) => {
      toast.success('Data berhasil dibanned!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal membanned data. Silakan coba lagi.'
      })
  });

export const adminUnbanCustomerMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: unbanCustomerApi,
    onSuccess: (data) => {
      toast.success('Data berhasil diunbanned!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal mengunbanned data. Silakan coba lagi.'
      })
  });

export const adminSendCustomerResetPasswordMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: sendResetPasswordLinkApi,
    onSuccess: (data) => {
      toast.success('Link reset kata sandi berhasil dikirim!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal mengirim link reset kata sandi. Silakan coba lagi.'
      })
  });
