import { loginApi, logoutApi, registerApi, updateProfileApi } from '@/api/admin/auth';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const adminLoginMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
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

export const adminRegisterMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
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

export const adminLogoutMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
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

export const adminUpdateProfileMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateProfileApi,
    onSuccess: (data) => {
      toast.success('Profile updated successfully!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Profile update failed. Please try again.');
      onError?.(error);
    }
  });
