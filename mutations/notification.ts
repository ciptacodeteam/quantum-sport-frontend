import { markNotificationReadApi } from '@/api/notification';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const markNotificationReadMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: markNotificationReadApi,
    onSuccess: (data) => {
      const successMsg = data?.msg || 'Notifikasi ditandai sebagai dibaca';
      toast.success(successMsg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Gagal menandai notifikasi. Silakan coba lagi.'
      })
  });
