'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ManagedDialog
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { adminMembershipTransactionsQueryOptions } from '@/queries/admin/membershipTransaction';
import type { MembershipUser } from '@/types/model';
import {
  IconEye,
  IconFileExcel,
  IconCheck,
  IconX,
  IconPlayerPause,
  IconPlayerPlay
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import * as React from 'react';
import { useState } from 'react';
import { membershipStatus, canManageMembership } from '@/lib/membership-transaction-display';
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
import MembershipTransactionDetailsDialog from './MembershipTransactionDetailsDialog';

const columnHelper = createColumnHelper<MembershipUser>();

type MembershipSportFilter = 'all' | 'PADEL' | 'TENNIS';

const sportLabels: Record<'PADEL' | 'TENNIS', string> = {
  PADEL: 'Padel',
  TENNIS: 'Tennis'
};

const formatDate = (date: Date | string): string => {
  return dayjs(date).format('DD MMM YYYY');
};

const MembershipTransactionTable = () => {
  const [status, setStatus] = useState('all');
  const [sport, setSport] = useState<MembershipSportFilter>('all');
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (sport !== 'all') params.sport = sport;
    if (status !== 'all') params.status = status;
    return params;
  }, [sport, status]);
  const query = useQuery(adminMembershipTransactionsQueryOptions(queryParams));

  const transactions = query.data ?? [];

  const { confirmAndMutate: approveTx } = useApproveMembershipTransactionMutation();
  const { confirmAndMutate: rejectTx } = useRejectMembershipTransactionMutation();
  const { mutateAsync: suspendTx, isPending: suspending } =
    useSuspendMembershipTransactionMutation();
  const { confirmAndMutate: unsuspendTx } = useUnsuspendMembershipTransactionMutation();
  const { mutate: exportExcel, isPending: exporting } = useExportMembershipTransactionsExcel();

  const columns = useMemo(
    () => [
      columnHelper.accessor(
        (item) =>
          [item.user?.name, item.user?.phone, item.user?.email, item.invoice?.number]
            .filter(Boolean)
            .join(' '),
        {
          id: 'customer',
          header: 'Pelanggan',
          cell: (info) => {
            const { user, invoice } = info.row.original;
            return (
              <div className="flex min-w-36 items-center gap-1.5">
                <p
                  className="max-w-48 truncate text-sm font-medium"
                  title={user?.name || 'Pelanggan'}
                >
                  {user?.name || 'Pelanggan'}
                </p>
                {invoice?.number && (
                  <CopyButton
                    content={invoice.number}
                    variant="ghost"
                    size="sm"
                    aria-label={`Salin invoice ${invoice.number}`}
                    title={invoice.number}
                  />
                )}
              </div>
            );
          },
          size: 250
        }
      ),
      columnHelper.accessor((item) => item.membership?.name, {
        id: 'membership',
        header: 'Value Pack',
        cell: (info) => {
          const membership = info.row.original.membership;
          if (!membership) return '-';

          return (
            <p
              className="max-w-64 truncate text-sm"
              title={`${membership.name} · ${sportLabels[membership.sport ?? 'PADEL']} · ${membership.sessions} sesi · ${membership.duration} hari`}
            >
              {membership.name}
            </p>
          );
        },
        size: 200
      }),
      columnHelper.accessor('endDate', {
        header: 'Berlaku sampai',
        cell: (info) => {
          const row = info.row.original;

          return (
            <span className="text-sm tabular-nums" title={`Mulai ${formatDate(row.startDate)}`}>
              {row.endDate ? formatDate(row.endDate) : '—'}
            </span>
          );
        },
        size: 160
      }),
      columnHelper.accessor('remainingSessions', {
        header: 'Sisa kuota',
        cell: (info) => {
          const row = info.row.original;
          return (
            <span
              className="text-sm tabular-nums"
              title={`Sisa masa berlaku ${row.remainingDuration} hari`}
            >
              {info.getValue()}
              <span className="text-muted-foreground">
                {' '}
                / {row.membership?.sessions ?? '—'} sesi
              </span>
            </span>
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
            <Badge
              variant={
                membershipStatus(row) === 'Aktif'
                  ? 'lightSuccess'
                  : row.isSuspended
                    ? 'lightWarning'
                    : 'lightNeutral'
              }
            >
              {membershipStatus(row)}
            </Badge>
          );
        },
        size: 120
      }),
      columnHelper.display({
        id: 'amount',
        header: 'Total',
        cell: (info) => {
          const invoice = info.row.original.invoice;
          if (!invoice) return '-';

          return (
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(invoice.total)}
            </span>
          );
        },
        size: 140
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const transaction = info.row.original;
          const canApproveOrReject = transaction.invoice?.status === 'PENDING';

          return (
            <div className="flex items-center gap-1">
              <ManagedDialog id={`membership-detail-${transaction.id}`}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Lihat detail"
                    aria-label="Lihat detail Value Pack"
                  >
                    <IconEye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <MembershipTransactionDetailsDialog transaction={transaction} />
              </ManagedDialog>

              {canApproveOrReject && (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-emerald-600"
                    title="Setujui pembayaran"
                    aria-label="Setujui pembayaran"
                    onClick={() => approveTx(transaction.id)}
                  >
                    <IconCheck />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive"
                    title="Tolak pembayaran"
                    aria-label="Tolak pembayaran"
                    onClick={() => rejectTx({ id: transaction.id })}
                  >
                    <IconX />
                  </Button>
                </div>
              )}

              {!transaction.isSuspended && canManageMembership(transaction) && (
                <SuspendMembershipDialog
                  id={transaction.id}
                  pending={suspending}
                  onSubmit={(reason, endDate) =>
                    suspendTx({ id: transaction.id, reason, endDate: endDate ?? undefined })
                  }
                />
              )}
              {transaction.isSuspended && canManageMembership(transaction) && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Aktifkan kembali"
                  aria-label="Aktifkan kembali"
                  onClick={() => unsuspendTx(transaction.id)}
                >
                  <IconPlayerPlay />
                </Button>
              )}
            </div>
          );
        },
        size: 100
      })
    ],
    [approveTx, rejectTx, suspendTx, suspending, unsuspendTx]
  );

  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">Data Value Pack belum dapat dimuat.</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  return (
    <div className="[&_thead]:bg-muted/50 min-w-0 space-y-4 [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:text-xs">
      <DataTable
        columns={columns}
        data={transactions}
        loading={query.isPending}
        enableRowSelection={false}
        getRowId={(item) => item.id}
        searchPlaceholder="Cari pelanggan, paket, atau invoice..."
        columnVisibilityLabel="Kolom"
        columnVisibilityStorageKey="quantum:membership-transactions:columns"
        rightActions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Select
                value={sport}
                onValueChange={(value) => setSport(value as MembershipSportFilter)}
              >
                <SelectTrigger
                  id="membership-sport-filter"
                  aria-label="Olahraga Value Pack"
                  className="h-9 w-40 rounded-lg shadow-none"
                >
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua olahraga</SelectItem>
                  <SelectItem value="PADEL">Padel</SelectItem>
                  <SelectItem value="TENNIS">Tennis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                className="h-9 w-48 rounded-lg shadow-none"
                aria-label="Status Value Pack"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {[
                  'Aktif',
                  'Menunggu pembayaran',
                  'Ditangguhkan',
                  'Kedaluwarsa',
                  'Sesi habis',
                  'Dibatalkan'
                ].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportExcel(queryParams)}
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

export default MembershipTransactionTable;

const SuspendMembershipDialog = ({
  id,
  pending,
  onSubmit
}: {
  id: string;
  pending: boolean;
  onSubmit: (reason: string, endDate?: string | null) => Promise<unknown>;
}) => {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [endDate, setEndDate] = React.useState<Date | null | undefined>(undefined);

  async function handleSubmit() {
    if (!reason.trim()) return;
    try {
      await onSubmit(reason.trim(), endDate ? endDate.toISOString() : undefined);
    } catch {
      return;
    }
    setOpen(false);
    setReason('');
    setEndDate(undefined);
  }

  return (
    <ManagedDialog id={`suspend-membership-${id}`} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          title="Tangguhkan paket"
          aria-label="Tangguhkan paket"
        >
          <IconPlayerPause />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 gap-2 border-b p-5 pr-12 text-left">
          <DialogTitle className="text-foreground text-lg">Tangguhkan Value Pack</DialogTitle>
          <DialogDescription>
            Tambahkan alasan dan tanggal akhir penangguhan jika diperlukan.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label htmlFor={`suspend-reason-${id}`} className="mb-2 block text-xs font-medium">
              Alasan penangguhan
            </label>
            <Input
              id={`suspend-reason-${id}`}
              disabled={pending}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium">Tanggal akhir (opsional)</p>
            <DatePickerInput value={endDate ?? null} onValueChange={setEndDate} />
          </div>
        </div>
        <footer className="bg-muted/20 flex shrink-0 justify-end gap-2 border-t p-4">
          <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={pending} disabled={pending || !reason.trim()}>
            Konfirmasi Penangguhan
          </Button>
        </footer>
      </DialogContent>
    </ManagedDialog>
  );
};
