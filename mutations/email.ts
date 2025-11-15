import { sendEmailOtpApi, verifyEmailOtpApi } from '@/api/email';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const sendEmailOtpMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: sendEmailOtpApi,
    onSuccess: (data) => {
      toast.success('Verification email sent!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to send email OTP. Please try again.');
      onError?.(error);
    }
  });

export const verifyEmailOtpMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: verifyEmailOtpApi,
    onSuccess: (data) => {
      toast.success('Email verified successfully!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to verify email OTP. Please try again.');
      onError?.(error);
    }
  });
