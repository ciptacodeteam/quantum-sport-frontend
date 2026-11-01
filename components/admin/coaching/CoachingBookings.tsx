'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { coachingApi, type CoachingBooking } from '@/api/admin/coaching';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CoachingBookings({ kind }: { kind: 'COACH' | 'BALLBOY' }) {
  const { branchId } = useAdminCourtSports();
  const query = useQuery({
    queryKey: ['admin', 'coaching', branchId, 'bookings', kind],
    queryFn: () => coachingApi.bookings(kind),
    refetchInterval: 15000
  });
  const col = createColumnHelper<CoachingBooking>();
  const columns = [
    col.accessor('name', { header: kind === 'COACH' ? 'Coach' : 'Ballboy' }),
    col.display({
      id: 'customer',
      header: 'Pelanggan',
      cell: ({ row }) => (
        <div>
          <p>{row.original.customer}</p>
          <p className="text-muted-foreground text-xs">{row.original.phone}</p>
        </div>
      )
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
    col.display({
      id: 'invoice',
      header: 'Invoice',
      cell: ({ row: { original: r } }) =>
        r.invoice ? (
          <div className="space-y-1">
            <Link
              className="text-primary underline"
              href={`/admin/kelola-transaksi/${r.invoice.id}`}
            >
              {r.invoice.number} ↗
            </Link>
            <p className="text-muted-foreground text-xs">
              {r.invoice.status === 'PAID'
                ? 'Lunas'
                : r.invoice.status === 'PENDING'
                  ? 'Menunggu pembayaran'
                  : r.invoice.status}{' '}
              · Rp {r.invoice.total.toLocaleString('id-ID')}
            </p>
          </div>
        ) : (
          '-'
        )
    })
  ];
  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Pemesanan {kind === 'COACH' ? 'Coach' : 'Ballboy'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            500 pemesanan terbaru beserta invoice. Tambahkan layanan melalui detail booking lapangan
            di Schedule.
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
        />
      )}
    </main>
  );
}
