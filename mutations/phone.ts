import { sendPhoneOtpApi } from '@/api/phone';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const sendPhoneOtpMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: sendPhoneOtpApi,
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
