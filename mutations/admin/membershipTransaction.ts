import {
  approveAdminMembershipTransactionApi,
  rejectAdminMembershipTransactionApi,
  suspendAdminMembershipTransactionApi,
  unsuspendAdminMembershipTransactionApi,
  exportAdminMembershipTransactionsExcelApi
} from '@/api/admin/membershipTransaction';
import type { SearchParamsData } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';

export const useApproveMembershipTransactionMutation = () => {
  return useConfirmMutation<string, any>(
    {
      mutationFn: (id: string) => approveAdminMembershipTransactionApi(id)
    },
    {
      title: 'Approve transaction?',
      description: 'This will approve the membership transaction.',
      confirmText: 'Approve',
      destructive: false,
      toastMessages: {
        loading: 'Approving…',
        success: 'Transaction approved',
        error: 'Failed to approve transaction'
      },
      invalidate: [['admin', 'membership-transactions']]
    }
  );
};

export const useRejectMembershipTransactionMutation = () => {
  return useConfirmMutation<{ id: string; reason?: string }, any>(
    {
      mutationFn: ({ id, reason }) => rejectAdminMembershipTransactionApi(id, { reason })
    },
    {
      title: 'Reject transaction?',
      description: 'This will reject the membership transaction.',
      confirmText: 'Reject',
      destructive: true,
      toastMessages: {
        loading: 'Rejecting…',
        success: 'Transaction rejected',
        error: 'Failed to reject transaction'
      },
      invalidate: [['admin', 'membership-transactions']]
    }
  );
};

export const useSuspendMembershipTransactionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; reason: string; endDate?: string }) =>
      suspendAdminMembershipTransactionApi(vars.id, { reason: vars.reason, endDate: vars.endDate }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'membership-transactions'] });
      toast.success('Membership suspended');
    },
    onError: () => toast.error('Failed to suspend membership')
  });
};

export const useUnsuspendMembershipTransactionMutation = () => {
  return useConfirmMutation<string, any>(
    {
      mutationFn: (id: string) => unsuspendAdminMembershipTransactionApi(id)
    },
    {
      title: 'Unsuspend membership?',
      description: 'This will reactivate the membership.',
      confirmText: 'Unsuspend',
      destructive: false,
      toastMessages: {
        loading: 'Unsuspending…',
        success: 'Membership unsuspended',
        error: 'Failed to unsuspend membership'
      },
      invalidate: [['admin', 'membership-transactions']]
    }
  );
};

export const useExportMembershipTransactionsExcel = () => {
  return useMutation({
    mutationFn: (query: SearchParamsData = {}) => exportAdminMembershipTransactionsExcelApi(query),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `membership-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export generated');
    },
    onError: () => toast.error('Failed to export Excel')
  });
};
