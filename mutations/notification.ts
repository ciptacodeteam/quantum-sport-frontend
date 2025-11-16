import { markNotificationReadApi } from '@/api/notification';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
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
    onError: (error: any) => {
      console.error('Error:', error);
      const errorMsg =
        error?.response?.data?.msg ||
        error?.msg ||
        error?.message ||
        'Gagal menandai notifikasi. Silakan coba lagi.';
      toast.error(errorMsg);
      onError?.(error);
    }
  });
