import {
  createAdminNotificationApi,
  markAdminNotificationReadApi,
  markAllNotificationsReadApi
} from '@/api/admin/notification';
import type { CreateNotificationPayload } from '@/types/model';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useCreateNotificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) => createAdminNotificationApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      toast.success('Notifikasi berhasil dikirim');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal mengirim notifikasi');
    }
  });
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markAdminNotificationReadApi(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
    onError: () => {
      toast.error('Gagal menandai notifikasi sebagai dibaca');
    }
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      toast.success('Semua notifikasi ditandai sebagai dibaca');
    },
    onError: () => {
      toast.error('Gagal menandai semua notifikasi sebagai dibaca');
    }
  });
};
