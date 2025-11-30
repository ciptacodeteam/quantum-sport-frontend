'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { PAYMENT_STATUS_BADGE_VARIANT, PAYMENT_STATUS_MAP } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { adminMembershipTransactionsQueryOptions } from '@/queries/admin/membershipTransaction';
import type { MembershipUser } from '@/types/model';
import { IconEye, IconFileExcel } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CopyButton } from '@/components/ui/clipboard-copy';
import {
  useApproveMembershipTransactionMutation,
  useRejectMembershipTransactionMutation,
  useSuspendMembershipTransactionMutation,
  useUnsuspendMembershipTransactionMutation,
  useExportMembershipTransactionsExcel
} from '@/mutations/admin/membershipTransaction';
import { Input } from '@/components/ui/input';
import DatePickerInput from '@/components/ui/date-picker-input';

const columnHelper = createColumnHelper<MembershipUser>();

const formatDate = (date: Date | string): string => {
  return dayjs(date).format('DD MMM YYYY');
};

const MembershipTransactionTable = () => {
  const { data: transactions = [], isLoading } = useQuery(
    adminMembershipTransactionsQueryOptions({})
  );

  const { confirmAndMutate: approveTx } = useApproveMembershipTransactionMutation();
  const { confirmAndMutate: rejectTx } = useRejectMembershipTransactionMutation();
  const { mutate: suspendTx } = useSuspendMembershipTransactionMutation();
  const { confirmAndMutate: unsuspendTx } = useUnsuspendMembershipTransactionMutation();
  const { mutate: exportExcel, isPending: exporting } = useExportMembershipTransactionsExcel();

  const columns = useMemo(
    () => [
      columnHelper.accessor('user', {
        header: 'Customer',
        cell: (info) => {
          const user = info.getValue();
          if (!user) return '-';

          const name = user.name || '-';
          const initials = name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image || undefined} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-muted-foreground text-xs">{user.phone}</p>
              </div>
            </div>
          );
        },
        size: 250
      }),
      columnHelper.accessor('membership', {
        header: 'Membership',
        cell: (info) => {
          const membership = info.getValue();
          if (!membership) return '-';

          return (
            <div>
              <p className="font-medium">{membership.name}</p>
              <p className="text-muted-foreground text-xs">
                {membership.sessions} sessions · {membership.duration} days
              </p>
            </div>
          );
        },
        size: 200
      }),
      columnHelper.accessor('invoice', {
        header: 'Invoice',
        cell: (info) => {
          const invoice = info.getValue();
          if (!invoice) return '-';

          return (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{invoice.number}</span>
              <CopyButton variant={'ghost'} size={'lg'} value={invoice.number} />
            </div>
          );
        },
        size: 180
      }),
      columnHelper.accessor('startDate', {
        header: 'Period',
        cell: (info) => {
          const row = info.row.original;
          // Calculate end date based on start date + remaining duration
          const calculatedEndDate =
            row.remainingDuration > 0
              ? dayjs(row.startDate).add(row.remainingDuration, 'day').toDate()
              : null;

          return (
            <div className="text-sm">
              <p className="font-medium">{formatDate(row.startDate)}</p>
              <p className="text-muted-foreground text-xs">
                to {calculatedEndDate ? formatDate(calculatedEndDate) : '-'}
              </p>
            </div>
          );
        },
        size: 160
      }),
      columnHelper.accessor('remainingSessions', {
        header: 'Remaining',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="text-sm">
              <p>{info.getValue()} sessions</p>
              <p className="text-muted-foreground text-xs">{row.remainingDuration} days</p>
            </div>
          );
        },
        size: 120
      }),
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const row = info.row.original;

          return (
            <div className="flex flex-col gap-1">
              {row.isSuspended && (
                <Badge variant="destructive" className="w-fit">
                  Suspended
                </Badge>
              )}
              {row.isExpired && (
                <Badge variant="secondary" className="w-fit">
                  Expired
                </Badge>
              )}
              {!row.isSuspended && !row.isExpired && (
                <Badge variant="success" className="w-fit">
                  Active
                </Badge>
              )}
              {row.invoice?.status && (
                <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[row.invoice.status]} className="w-fit">
                  {PAYMENT_STATUS_MAP[row.invoice.status]}
                </Badge>
              )}
            </div>
          );
        },
        size: 120
      }),
      columnHelper.display({
        id: 'amount',
        header: 'Amount',
        cell: (info) => {
          const invoice = info.row.original.invoice;
          if (!invoice) return '-';

          return (
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(invoice.total)}</p>
              {invoice.payment && (
                <p className="text-muted-foreground text-xs">via {invoice.payment.method.name}</p>
              )}
            </div>
          );
        },
        size: 140
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const transaction = info.row.original;
          const canApproveOrReject = transaction.invoice?.status === 'PENDING';

          return (
            <div className="flex gap-2">
              <ManagedDialog id={`membership-detail-${transaction.id}`}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <IconEye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Membership Transaction Detail</DialogTitle>
                  </DialogHeader>
                  <MembershipTransactionDetail transaction={transaction} />
                </DialogContent>
              </ManagedDialog>

              {canApproveOrReject && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondarySuccess"
                    onClick={() => approveTx(transaction.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondaryDanger"
                    onClick={() => rejectTx({ id: transaction.id })}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {!transaction.isSuspended && !transaction.isExpired && (
                <SuspendMembershipDialog
                  onSubmit={(reason, endDate) =>
                    suspendTx({ id: transaction.id, reason, endDate: endDate ?? undefined })
                  }
                />
              )}
              {transaction.isSuspended && (
                <Button size="sm" variant="outline" onClick={() => unsuspendTx(transaction.id)}>
                  Unsuspend
                </Button>
              )}
            </div>
          );
        },
        size: 100
      })
    ],
    [approveTx, rejectTx, suspendTx, unsuspendTx]
  );

  return (
    <div>
      <DataTable
        columns={columns}
        data={transactions}
        loading={isLoading}
        rightActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportExcel({})}
              disabled={exporting}
            >
              <IconFileExcel />
              {exporting ? 'Exporting…' : 'Export Excel'}
            </Button>
          </div>
        }
      />
    </div>
  );
};

const MembershipTransactionDetail = ({ transaction }: { transaction: MembershipUser }) => {
  const { user, membership, invoice } = transaction;

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="border-b pb-4">
        <h3 className="mb-3 font-semibold">Customer Information</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Name</p>
            <p className="font-medium">{user?.name || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Phone</p>
            <p className="font-medium">{user?.phone || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Email</p>
            <p className="font-medium">{user?.email || '-'}</p>
          </div>
        </div>
      </div>

      {/* Membership Info */}
      <div className="border-b pb-4">
        <h3 className="mb-3 font-semibold">Membership Details</h3>
        <div className="space-y-3">
          <div>
            <p className="text-muted-foreground text-sm">Package</p>
            <p className="text-lg font-semibold">{membership?.name || '-'}</p>
            <p className="text-muted-foreground text-sm">{membership?.description || ''}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">Sessions</p>
              <p className="font-medium">{membership?.sessions || 0} sessions</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Duration</p>
              <p className="font-medium">{membership?.duration || 0} days</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Price</p>
              <p className="font-medium">{formatCurrency(membership?.price || 0)}</p>
            </div>
          </div>
          {membership?.benefits && membership.benefits.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-sm">Benefits</p>
              <ul className="list-inside list-disc space-y-1">
                {membership.benefits.map((benefit) => (
                  <li key={benefit.id} className="text-sm">
                    {benefit.benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Info */}
      <div className="border-b pb-4">
        <h3 className="mb-3 font-semibold">Transaction Information</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Start Date</p>
            <p className="font-medium">{formatDate(transaction.startDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">End Date</p>
            <p className="font-medium">
              {transaction.remainingDuration > 0
                ? formatDate(
                    dayjs(transaction.startDate).add(transaction.remainingDuration, 'day').toDate()
                  )
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Remaining Sessions</p>
            <p className="font-medium">{transaction.remainingSessions}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Remaining Duration</p>
            <p className="font-medium">{transaction.remainingDuration} days</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Status</p>
            <div className="flex gap-2">
              {transaction.isSuspended && <Badge variant="destructive">Suspended</Badge>}
              {transaction.isExpired && <Badge variant="secondary">Expired</Badge>}
              {!transaction.isSuspended && !transaction.isExpired && (
                <Badge variant="success">Active</Badge>
              )}
            </div>
          </div>
          {transaction.isSuspended && (
            <>
              <div>
                <p className="text-muted-foreground text-sm">Suspension Reason</p>
                <p className="font-medium">{transaction.suspensionReason || '-'}</p>
              </div>
              {transaction.suspensionEndDate && (
                <div>
                  <p className="text-muted-foreground text-sm">Suspension End Date</p>
                  <p className="font-medium">{formatDate(transaction.suspensionEndDate)}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invoice Info */}
      {invoice && (
        <div>
          <h3 className="mb-3 font-semibold">Payment Information</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Invoice Number</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-medium">{invoice.number}</p>
                <CopyButton variant={'ghost'} value={invoice.number} />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Payment Status</p>
              <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[invoice.status]}>
                {PAYMENT_STATUS_MAP[invoice.status]}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(invoice.total)}</p>
            </div>
            {invoice.payment && (
              <>
                <div>
                  <p className="text-muted-foreground text-sm">Payment Method</p>
                  <p className="font-medium">{invoice.payment.method.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Payment Fee</p>
                  <p className="font-medium">{formatCurrency(invoice.payment.fee)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Reference ID</p>
                  <p className="font-mono text-sm">{invoice.payment.referenceId}</p>
                </div>
              </>
            )}
            {invoice.paidAt && (
              <div>
                <p className="text-muted-foreground text-sm">Paid At</p>
                <p className="font-medium">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
            {invoice.expiresAt && invoice.status === 'PENDING' && (
              <div>
                <p className="text-muted-foreground text-sm">Expires At</p>
                <p className="font-medium">{formatDate(invoice.expiresAt)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="border-t pt-4">
        <div className="text-muted-foreground grid gap-2 text-xs">
          <p>Created: {dayjs(transaction.createdAt).format('DD MMM YYYY HH:mm')}</p>
          <p>Updated: {dayjs(transaction.updatedAt).format('DD MMM YYYY HH:mm')}</p>
        </div>
      </div>
    </div>
  );
};

export default MembershipTransactionTable;

const SuspendMembershipDialog = ({
  onSubmit
}: {
  onSubmit: (reason: string, endDate?: string | null) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [endDate, setEndDate] = React.useState<Date | null | undefined>(undefined);

  function handleSubmit() {
    if (!reason.trim()) return;
    onSubmit(reason.trim(), endDate ? endDate.toISOString() : undefined);
    setOpen(false);
    setReason('');
    setEndDate(undefined);
  }

  return (
    <ManagedDialog id={`suspend-membership`} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Suspend
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend Membership</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm">Reason</p>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason"
            />
          </div>
          <div>
            <p className="mb-1 text-sm">End Date (optional)</p>
            <DatePickerInput value={endDate ?? null} onValueChange={setEndDate} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!reason.trim()}>
              Confirm Suspend
            </Button>
          </div>
        </div>
      </DialogContent>
    </ManagedDialog>
  );
};
