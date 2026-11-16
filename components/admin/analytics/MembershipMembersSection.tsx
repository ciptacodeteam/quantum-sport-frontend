'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getMembershipMembers,
  getMembershipMemberTracking,
  type MembershipMember
} from '@/api/admin/membership-members';
import AppSectionHeader from '@/components/ui/app-section-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { getApiErrorMessage } from '@/lib/api-error';
import { membershipTypeLabels } from '@/lib/membership-hours';
import {
  bookingScheduleInJakarta,
  formatBookingDate,
  formatBookingSlotDate
} from '@/lib/booking-display';
import type { TrackedPackage } from '@/types/membership-tracking';

const statuses: Record<TrackedPackage['status'], string> = {
  ACTIVE: 'Aktif',
  EXPIRED: 'Kedaluwarsa',
  SUSPENDED: 'Ditangguhkan',
  EXHAUSTED: 'Jam habis',
  UPCOMING: 'Belum dimulai',
  PENDING: 'Menunggu pembayaran',
  PAYMENT_FAILED: 'Pembayaran tidak selesai'
};
const hours = (value: number) => value.toLocaleString('id-ID', { maximumFractionDigits: 2 });

export function MembershipUsage({ pack }: { pack: TrackedPackage }) {
  const usage = [...pack.usage].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h3 className="font-semibold">{pack.name}</h3>
          <p className="text-muted-foreground text-sm">
            {pack.sport === 'PADEL' ? 'Padel' : 'Tennis'} · {membershipTypeLabels[pack.type]}
          </p>
        </div>
        <span className="text-primary text-sm font-medium">{statuses[pack.status]}</span>
      </div>
      <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground text-xs">Kuota paket</dt>
          <dd className="mt-1 font-semibold">{hours(pack.totalHours)} jam</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Sisa kuota</dt>
          <dd className="mt-1 font-semibold">{hours(pack.remainingHours)} jam</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Terpakai</dt>
          <dd className="mt-1 font-semibold">{hours(pack.usedHours)} jam</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Ditahan</dt>
          <dd className="mt-1 font-semibold">{hours(pack.heldHours)} jam</dd>
        </div>
      </dl>
      <p className="text-muted-foreground text-sm">
        Berlaku {formatBookingSlotDate(pack.startDate, 'DD MMM YYYY')}–
        {formatBookingSlotDate(pack.endDate, 'DD MMM YYYY')} · {pack.remainingDays} hari tersisa
      </p>
      {!!pack.debtSettledHours && (
        <p className="text-sm">
          Kuota untuk pelunasan kekurangan paket sebelumnya: −{hours(pack.debtSettledHours)} jam.
        </p>
      )}
      {!!pack.debtTransferredHours && (
        <p className="text-sm">
          Kekurangan dialihkan ke paket berikutnya: {hours(pack.debtTransferredHours)} jam.
        </p>
      )}
      <div>
        <h3 className="mb-2 font-semibold">Mutasi pemakaian</h3>
        <p className="text-muted-foreground mb-3 text-xs">
          Pemakaian ditampilkan per pemesanan. Jam ditahan belum menjadi pemakaian final; pemesanan
          dibatalkan tidak dihitung sebagai pemakaian.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal pemesanan (WIB)</TableHead>
              <TableHead>Invoice / Jadwal bermain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Mutasi jam</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usage.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  Belum ada pemakaian pada paket ini.
                </TableCell>
              </TableRow>
            )}
            {usage.map((entry) => {
              const confirmed = entry.status === 'CONFIRMED';
              const held = entry.status === 'HOLD';
              return (
                <TableRow key={entry.id}>
                  <TableCell className="align-top">
                    {formatBookingDate(entry.createdAt, 'DD MMM YYYY · HH:mm')}
                  </TableCell>
                  <TableCell className="min-w-56 align-top whitespace-normal">
                    <p className="font-medium">{entry.invoiceNumber || 'Tanpa invoice'}</p>
                    {entry.branch && (
                      <p className="text-muted-foreground mt-1 text-xs">{entry.branch.name}</p>
                    )}
                    {bookingScheduleInJakarta(entry.details).map((day) => (
                      <div key={day.date} className="mt-2 space-y-1 text-xs">
                        <p>{formatBookingSlotDate(day.date, 'DD MMM YYYY')}</p>
                        {day.courts.map((court) => (
                          <p key={court.id}>
                            {court.name} ·{' '}
                            {court.ranges
                              .map((range) => `${range.start.slice(11)}–${range.end.slice(11)}`)
                              .join(', ')}
                          </p>
                        ))}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="align-top">
                    {confirmed
                      ? 'Terkonfirmasi'
                      : held
                        ? 'Ditahan'
                        : entry.status === 'CANCELLED'
                          ? 'Dibatalkan'
                          : entry.status === 'EXPIRED'
                            ? 'Kedaluwarsa'
                            : 'Tidak terpakai'}
                  </TableCell>
                  <TableCell className="text-right align-top font-semibold tabular-nums">
                    {confirmed
                      ? `−${hours(entry.hours)} jam`
                      : held
                        ? `${hours(entry.hours)} jam ditahan`
                        : '0 jam'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MemberTrackingDialog({
  member,
  onClose
}: {
  member: MembershipMember;
  onClose: () => void;
}) {
  const tracking = useQuery({
    queryKey: ['admin', 'membership-members', 'tracking', member.id],
    queryFn: ({ signal }) => getMembershipMemberTracking(member.id, signal)
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Membership {member.user.name}</DialogTitle>
          <DialogDescription>
            {member.user.phone || member.user.email || 'Detail paket dan riwayat pemakaian member'}
          </DialogDescription>
        </DialogHeader>
        {tracking.isPending ? (
          <p role="status">Memuat mutasi member...</p>
        ) : tracking.isError ? (
          <div role="alert">
            <p>{getApiErrorMessage(tracking.error, 'Mutasi belum dapat dimuat.')}</p>
            <Button variant="outline" onClick={() => void tracking.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : tracking.data.packages[0] ? (
          <MembershipUsage pack={tracking.data.packages[0]} />
        ) : (
          <p>Paket tidak ditemukan.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function MembershipMembersSection() {
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [sport, setSport] = useState<'' | 'PADEL' | 'TENNIS'>('');
  const [page, setPage] = useState(1);
  const [member, setMember] = useState<MembershipMember | null>(null);
  useEffect(() => {
    if (search.trim() === q) return;
    const timeout = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, q]);
  const result = useQuery({
    queryKey: ['admin', 'membership-members', { q, sport, page }],
    queryFn: ({ signal }) => getMembershipMembers({ q, page, sport: sport || undefined }, signal)
  });
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <AppSectionHeader
        title="Membership Member"
        description="Pantau paket, sisa kuota, dan mutasi pemakaian setiap member di seluruh cabang."
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(search.trim());
          setPage(1);
        }}
        className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
      >
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="member-search">Cari member atau paket</Label>
          <Input
            id="member-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nama, telepon, email, atau nama paket"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="member-sport">Olahraga</Label>
          <Select
            value={sport || 'all'}
            onValueChange={(value) => {
              setSport(value === 'all' ? '' : (value as 'PADEL' | 'TENNIS'));
              setPage(1);
            }}
          >
            <SelectTrigger id="member-sport" className="bg-background w-full gap-4 pr-4 pl-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="min-w-(--radix-select-trigger-width) rounded-lg p-1"
            >
              <SelectItem value="all" className="min-h-10 rounded-md pl-3">
                Semua olahraga
              </SelectItem>
              <SelectItem value="PADEL" className="min-h-10 rounded-md pl-3">
                Padel
              </SelectItem>
              <SelectItem value="TENNIS" className="min-h-10 rounded-md pl-3">
                Tennis
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full sm:w-auto"
          onClick={() => void result.refetch()}
          disabled={result.isFetching}
        >
          Muat ulang
        </Button>
      </form>
      {search.trim() !== q && (
        <p role="status" className="text-muted-foreground text-sm">
          Mencari member...
        </p>
      )}
      {result.isPending ? (
        <p role="status">Memuat daftar member...</p>
      ) : result.isError ? (
        <div role="alert">
          <p>{getApiErrorMessage(result.error, 'Daftar member belum dapat dimuat.')}</p>
          <Button onClick={() => void result.refetch()}>Coba lagi</Button>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {result.data.total} paket member · Satu baris untuk setiap paket yang telah dibayar.
          </p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sisa kuota</TableHead>
                  <TableHead>Berlaku hingga</TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.packages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      Tidak ada paket member yang sesuai.
                    </TableCell>
                  </TableRow>
                )}
                {result.data.packages.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell>
                      <p className="font-medium">{pack.user.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {pack.user.phone || pack.user.email || 'Kontak belum tersedia'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{pack.membership.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {pack.membership.sport === 'PADEL' ? 'Padel' : 'Tennis'} ·{' '}
                        {membershipTypeLabels[pack.membership.type]}
                      </p>
                    </TableCell>
                    <TableCell>{statuses[pack.status]}</TableCell>
                    <TableCell className="tabular-nums">
                      {hours(pack.remainingSessions)} / {hours(pack.membership.sessions)} jam
                    </TableCell>
                    <TableCell>{formatBookingSlotDate(pack.endDate, 'DD MMM YYYY')}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMember(pack)}
                        aria-label={`Lihat mutasi ${pack.user.name} · ${pack.membership.name}`}
                      >
                        Lihat mutasi
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-sm">
              Halaman {page} dari {Math.max(1, Math.ceil(result.data.total / result.data.pageSize))}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                disabled={page * result.data.pageSize >= result.data.total}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </>
      )}
      {member && (
        <MemberTrackingDialog key={member.id} member={member} onClose={() => setMember(null)} />
      )}
    </div>
  );
}
