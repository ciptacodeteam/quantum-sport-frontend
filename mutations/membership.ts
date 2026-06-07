import { doMembershipCheckoutApi } from '@/api/membership';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const membershipCheckoutMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: doMembershipCheckoutApi,
    onSuccess: (data) => {
      toast.success('Checkout membership berhasil!');
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal melakukan checkout membership. Silakan coba lagi.'
      })
  });
