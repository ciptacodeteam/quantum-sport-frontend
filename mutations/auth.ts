import {
  checkAccountApi,
  forgotPasswordApi,
  loginApi,
  logoutApi,
  registerApi,
  resetPasswordApi,
  sendLoginOtpApi
} from '@/api/auth';
import { verifyPhoneOtpApi } from '@/api/phone';
import { profileQueryOptions } from '@/queries/profile';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const checkAccountMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: checkAccountApi,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to check account. Please try again.');
      onError?.(error);
    }
  });

export const sendLoginOtpMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: sendLoginOtpApi,
    onSuccess: (data) => {
      toast.success('OTP sent successfully!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to send OTP. Please try again.');
      onError?.(error);
    }
  });

export const loginMutationOptions = ({ onSuccess, onError, queryClient }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: loginApi,
    onSuccess: (data) => {
      toast.success('Login successful!');
      queryClient?.invalidateQueries({ queryKey: profileQueryOptions.queryKey });
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Login failed. Please check your credentials and try again.');
      onError?.(error);
    }
  });

export const registerMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: registerApi,
    onSuccess: (data) => {
      toast.success('Registration successful!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Registration failed. Please check your details and try again.');
      onError?.(error);
    }
  });

export const logoutMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: logoutApi,
    onSuccess: (data) => {
      toast.success('Logout successful!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Logout failed. Please try again.');
      onError?.(error);
    }
  });

export const forgotPasswordMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: forgotPasswordApi,
    onSuccess: (data) => {
      toast.success('OTP sent successfully!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to send OTP. Please try again.');
      onError?.(error);
    }
  });

export const resetPasswordMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: resetPasswordApi,
    onSuccess: (data) => {
      toast.success('Password reset successfully!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to reset password. Please try again.');
      onError?.(error);
    }
  });

export const verifyPhoneOtpMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: verifyPhoneOtpApi,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to verify OTP. Please try again.');
      onError?.(error);
    }
  });
