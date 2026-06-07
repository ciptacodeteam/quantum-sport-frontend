import {
  changePasswordApi,
  loginApi,
  logoutApi,
  registerApi,
  updateProfileApi
} from '@/api/admin/auth';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const adminLoginMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: loginApi,
    onSuccess: (data) => {
      toast.success('Login successful!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Login failed. Please check your credentials and try again.'
      })
  });

export const adminRegisterMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
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

export const adminLogoutMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
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

export const adminUpdateProfileMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateProfileApi,
    onSuccess: (data) => {
      toast.success('Profile updated successfully!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Profile update failed. Please try again.'
      })
  });

export const adminChangePasswordMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: changePasswordApi,
    onSuccess: (data) => {
      toast.success('Password changed successfully!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Password change failed. Please try again.'
      })
  });
