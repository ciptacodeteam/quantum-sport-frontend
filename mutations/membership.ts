import { doMembershipCheckoutApi } from '@/api/membership';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

export const membershipCheckoutMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: doMembershipCheckoutApi,
    onSuccess: (data) => {
      toast.success('Checkout membership berhasil!');
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Gagal melakukan checkout membership. Silakan coba lagi.');
      onError?.(error);
    }
  });
