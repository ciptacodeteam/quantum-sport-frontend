import { loginApi, logoutApi, registerApi, sendLoginOtpApi } from '@/api/auth';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

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
export const loginMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: loginApi,
    onSuccess: (data) => {
      toast.success('Login successful!');
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
