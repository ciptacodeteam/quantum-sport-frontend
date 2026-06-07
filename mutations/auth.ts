import {
  checkAccountApi,
  forgotPasswordApi,
  loginApi,
  logoutApi,
  passwordResetWithTokenApi,
  registerApi,
  resetPasswordApi,
  sendLoginOtpApi,
  verifyPasswordApi,
  changePasswordApi
} from '@/api/auth';
import { verifyPhoneOtpApi } from '@/api/phone';
import { profileQueryOptions } from '@/queries/profile';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const checkAccountMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: checkAccountApi,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to check account. Please try again.'
      })
  });

export const sendLoginOtpMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: sendLoginOtpApi,
    onSuccess: (data) => {
      toast.success('OTP sent successfully!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to send OTP. Please try again.'
      })
  });

export const loginMutationOptions = ({ onSuccess, onError, queryClient }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: loginApi,
    onSuccess: (data) => {
      toast.success('Login successful!');
      queryClient?.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Login failed. Please check your credentials and try again.'
      })
  });

export const registerMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: registerApi,
    onSuccess: (data) => {
      toast.success('Registration successful!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Registration failed. Please check your details and try again.'
      })
  });

export const logoutMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: logoutApi,
    onSuccess: (data) => {
      toast.success('Logout successful!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Logout failed. Please try again.'
      })
  });

export const forgotPasswordMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: forgotPasswordApi,
    onSuccess: (data) => {
      toast.success('OTP sent successfully!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to send OTP. Please try again.'
      })
  });

export const resetPasswordMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: resetPasswordApi,
    onSuccess: (data) => {
      toast.success('Password reset successfully!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to reset password. Please try again.'
      })
  });

export const resetPasswordWithTokenMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: passwordResetWithTokenApi,
    onSuccess: (data) => {
      toast.success('Password reset successfully!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to reset password. Please try again.'
      })
  });

export const verifyPhoneOtpMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: verifyPhoneOtpApi,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to verify OTP. Please try again.'
      })
  });

export const verifyPasswordMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: verifyPasswordApi,
    onSuccess: (data) => {
      toast.success('Kata sandi diverifikasi!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Kata sandi salah. Silakan coba lagi.'
      })
  });

export const changePasswordMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: changePasswordApi,
    onSuccess: (data) => {
      toast.success('Kata sandi berhasil diubah! Email konfirmasi telah dikirim.');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal mengubah kata sandi. Silakan coba lagi.'
      })
  });
