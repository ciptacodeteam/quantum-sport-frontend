import {
  sendEmailOtpApi,
  verifyEmailOtpApi,
  requestEmailChangeApi,
  verifyEmailChangeApi
} from '@/api/email';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const sendEmailOtpMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: sendEmailOtpApi,
    onSuccess: (data) => {
      toast.success('Verification email sent!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to send email OTP. Please try again.'
      })
  });

export const verifyEmailOtpMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: verifyEmailOtpApi,
    onSuccess: (data) => {
      toast.success('Email verified successfully!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to verify email OTP. Please try again.'
      })
  });

export const requestEmailChangeMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: requestEmailChangeApi,
    onSuccess: (data) => {
      toast.success('Verification code sent to new email!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to request email change. Please try again.'
      })
  });

export const verifyEmailChangeMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: verifyEmailChangeApi,
    onSuccess: (data) => {
      toast.success('Email changed successfully!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to verify email change. Please try again.'
      })
  });
