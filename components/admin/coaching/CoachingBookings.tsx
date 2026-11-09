'use client';
import { useState } from 'react';
import { Eye } from 'lucide-react';
import CoachingBookingDetail from './CoachingBookingDetail';
import BookingDateFilter from '@/components/admin/bookings/BookingDateFilter';
import { useBookingDateFilter } from '@/hooks/useBookingDateFilter';

import Link from 'next/link';
import CancelCoachDialog from './CancelCoachDialog';
import ReplaceCoachDialog from './ReplaceCoachDialog';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { coachingApi, type CoachingBooking } from '@/api/admin/coaching';
import { useHasRole } from '@/hooks/useRoleAccess';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { formatBookingDate } from '@/lib/booking-display';
import { getTwoWordName } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CoachingBookings({ kind }: { kind: 'COACH' | 'BALLBOY' }) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const { branchId } = useAdminCourtSports();
  const { dateRange, setDateRange, dateParams } = useBookingDateFilter();
  const canManageCoaches = useHasRole(['SUPER_ADMIN']);
  const canCancelServices = useHasRole(
    kind === 'BALLBOY' ? ['SUPER_ADMIN', 'ADMIN', 'CASHIER'] : ['SUPER_ADMIN', 'CASHIER']
  );
  const query = useQuery({
    queryKey: ['admin', 'coaching', branchId, 'bookings', kind, dateParams],
    queryFn: () => coachingApi.bookings(kind, dateParams),
    refetchInterval: 15000
  });
  const col = createColumnHelper<CoachingBooking>();
  const columns = [
    col.accessor('name', { header: kind === 'COACH' ? 'Coach' : 'Ballboy' }),
    col.display({
      id: 'customer',
      header: 'Pelanggan',
      cell: ({ row }) => <span>{row.original.customer}</span>
    }),
    col.display({
      id: 'time',
      header: 'Tanggal & Jam (WIB)',
      cell: ({ row: { original: r } }) => (
        <div>
          <p>{formatScheduleSlotTime(r.startAt, 'DD MMM YYYY')}</p>
          <p className="text-muted-foreground text-xs">
            {formatScheduleSlotTime(r.startAt)} - {formatScheduleSlotTime(r.endAt)}
          </p>
        </div>
      )
    }),
    col.accessor('court', { header: 'Lapangan' }),
    col.display({
      id: 'price',
      header: 'Harga layanan',
      cell: ({ row }) => `Rp ${row.original.price.toLocaleString('id-ID')}`
    }),
    col.display({
      id: 'status',
      header: 'Status Pemesanan',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'CONFIRMED' ? 'lightSuccess' : 'secondary'}>
          {row.original.status === 'CONFIRMED'
            ? 'Dikonfirmasi'
            : row.original.status === 'HOLD'
              ? 'Menunggu pembayaran'
              : 'Dibatalkan'}
        </Badge>
      )
    }),
    col.accessor('createdAt', {
      header: 'Dibuat Pada',
      cell: ({ row, getValue }) => (
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs">
            {row.original.cashier
              ? `Kasir: ${getTwoWordName(row.original.cashier.name)}`
              : 'Online'}
          </span>
          <span>{getValue() ? formatBookingDate(getValue()!, 'DD/MM/YYYY HH:mm') : '-'}</span>
        </div>
      )
    }),
    col.display({
      id: 'action',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Lihat detail ${row.original.name}`}
            title="Lihat detail pemesanan"
            onClick={() => setDetailId(row.original.id)}
          >
            <Eye aria-hidden="true" />
          </Button>
          {kind === 'COACH' && canManageCoaches && (
            <>
              <ReplaceCoachDialog
                iconOnly
                bookingCoachId={row.original.id}
                currentName={row.original.name}
                startAt={row.original.startAt}
                status={row.original.status}
              />
            </>
          )}
          {canCancelServices && (
            <CancelCoachDialog
              kind={kind}
              iconOnly
              bookingCoachId={row.original.id}
              currentName={row.original.name}
              startAt={row.original.startAt}
              status={row.original.status}
            />
          )}
        </div>
      )
    })
  ];
  const detail = query.data?.find((item) => item.id === detailId);
  return (
    <main className="space-y-6">
      <CoachingBookingDetail booking={detail} kind={kind} onClose={() => setDetailId(null)} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Pemesanan {kind === 'COACH' ? 'Coach' : 'Ballboy'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            500 pemesanan terbaru. Buka detail untuk melihat informasi pelanggan dan invoice.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/schedule">Buka Schedule</Link>
        </Button>
      </div>
      {query.isError ? (
        <div role="alert">
          <p>Pemesanan belum dapat dimuat.</p>
          <Button onClick={() => void query.refetch()}>Coba lagi</Button>
        </div>
      ) : (
        <DataTable
          data={query.data ?? []}
          columns={columns}
          loading={query.isPending}
          enableRowSelection={false}
          enableColumnVisibility={false}
          rightActions={<BookingDateFilter value={dateRange} onChange={setDateRange} />}
        />
      )}
    </main>
  );
}
