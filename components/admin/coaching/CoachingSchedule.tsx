'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { coachingApi, type CoachingSlot } from '@/api/admin/coaching';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { getApiErrorMessage } from '@/lib/api-error';
import dayjs, { nowJakarta } from '@/lib/dayjs';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import DatePickerInput from '@/components/ui/date-picker-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { coachingSportLabel } from './CoachingCatalog';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

const priceInputClass =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export default function CoachingSchedule({ staffId }: { staffId: string }) {
  const { hasAccess, isLoading } = useRoleAccess({ allowedRoles: ['ADMIN'] });
  const { branchId } = useAdminCourtSports();
  const client = useQueryClient();
  const [fromDate, setFromDate] = useState(() => nowJakarta().format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(() => nowJakarta().add(1, 'month').format('YYYY-MM-DD'));
  const [days, setDays] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [startHour, setStartHour] = useState(6),
    [endHour, setEndHour] = useState(24),
    [price, setPrice] = useState(0);
  const [editingSlot, setEditingSlot] = useState<CoachingSlot | null>(null);
  const [slotPrice, setSlotPrice] = useState(0);
  const person = useQuery({
    queryKey: ['admin', 'coaching', branchId, staffId],
    queryFn: () => coachingApi.person(staffId),
    enabled: hasAccess
  });
  const schedule = useQuery({
    queryKey: ['admin', 'coaching', branchId, staffId, 'schedule', fromDate, toDate],
    queryFn: () => coachingApi.schedule(staffId, fromDate, toDate),
    enabled: hasAccess
  });
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: ['admin', 'coaching'] });
  };
  const save = useMutation({
    mutationFn: () =>
      coachingApi.saveSchedule(staffId, { fromDate, toDate, days, startHour, endHour, price }),
    onSuccess: (result) => {
      invalidate();
      toast.success(
        `${result.created} slot baru, ${result.updated} harga diperbarui, ${result.skipped} slot terisi/ditutup dilewati.`
      );
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Jadwal belum dapat disimpan.'))
  });
  const toggle = useMutation({
    mutationFn: (slot: CoachingSlot) => coachingApi.toggle(slot.id, !slot.isAvailable),
    onSuccess: invalidate,
    onError: (error) => toast.error(getApiErrorMessage(error, 'Status belum dapat diubah.'))
  });
  const editPrice = useMutation({
    mutationFn: () => coachingApi.updatePrice(editingSlot!.id, slotPrice),
    onSuccess: () => {
      invalidate();
      setEditingSlot(null);
      toast.success('Harga slot diperbarui.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Harga belum dapat disimpan.'))
  });
  const col = createColumnHelper<CoachingSlot>();
  const columns = [
    col.accessor((slot) => formatScheduleSlotTime(slot.startAt, 'DD/MM/YYYY'), {
      id: 'date',
      sortingFn: (a, b) => a.original.startAt.localeCompare(b.original.startAt),
      header: 'Tanggal',
      cell: ({ row }) => formatScheduleSlotTime(row.original.startAt, 'DD/MM/YYYY')
    }),
    col.accessor(
      (slot) => `${formatScheduleSlotTime(slot.startAt)} - ${formatScheduleSlotTime(slot.endAt)}`,
      {
        id: 'time',
        header: 'Waktu (WIB)',
        cell: ({ row }) =>
          `${formatScheduleSlotTime(row.original.startAt)} - ${formatScheduleSlotTime(row.original.endAt)}`
      }
    ),
    col.accessor('price', {
      header: 'Harga per Jam',
      cell: ({ row }) => `Rp ${row.original.price.toLocaleString('id-ID')}`
    }),
    col.accessor(
      (slot) => (slot.booked ? 'Dibooking' : slot.isAvailable ? 'Tersedia' : 'Ditutup'),
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.booked
                ? 'lightWarning'
                : row.original.isAvailable
                  ? 'lightSuccess'
                  : 'secondary'
            }
          >
            {row.original.booked ? 'Dibooking' : row.original.isAvailable ? 'Tersedia' : 'Ditutup'}
          </Badge>
        )
      }
    ),
    col.display({
      id: 'action',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={row.original.booked || !branchId || branchId === 'all'}
            onClick={() => {
              setEditingSlot(row.original);
              setSlotPrice(row.original.price);
            }}
          >
            Edit harga
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={row.original.booked || toggle.isPending || !branchId || branchId === 'all'}
            onClick={() => toggle.mutate(row.original)}
          >
            {row.original.isAvailable ? 'Tutup slot' : 'Buka slot'}
          </Button>
        </div>
      )
    })
  ];
  if (isLoading || !hasAccess || person.isPending) return <p>Memuat...</p>;
  if (person.isError || !person.data)
    return <p role="alert">Profil tidak tersedia di cabang ini.</p>;
  return (
    <main className="w-full min-w-0 space-y-6">
      <Button asChild variant="ghost">
        <Link href={`/admin/coaching?kind=${person.data.role}`}>
          ← Kembali ke {person.data.role === 'COACH' ? 'Coaching' : 'Ballboy'}
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Jadwal & Harga · {person.data.name}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {person.data.role === 'BALLBOY'
            ? 'Ballboy · Tennis'
            : `Coach · ${coachingSportLabel(person.data.coachType)}`}{' '}
          · Waktu dalam WIB
        </p>
      </div>
      <form
        className="bg-background overflow-hidden rounded-2xl border"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="border-b px-5 py-4 sm:px-6">
          <h2 className="font-semibold">Atur jadwal & harga</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Pilih periode, jam layanan, dan tarif untuk membuat atau memperbarui slot.
          </p>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6 p-5 sm:p-6">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Periode layanan</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="coaching-from">Dari tanggal</Label>
                  <DatePickerInput
                    id="coaching-from"
                    value={dayjs(fromDate).toDate()}
                    onValueChange={(d) => {
                      if (d) setFromDate(dayjs(d).format('YYYY-MM-DD'));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coaching-to">Sampai tanggal</Label>
                  <DatePickerInput
                    id="coaching-to"
                    value={dayjs(toDate).toDate()}
                    onValueChange={(d) => {
                      if (d) setToDate(dayjs(d).format('YYYY-MM-DD'));
                    }}
                  />
                </div>
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Jam layanan · WIB</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ['Jam mulai', startHour, setStartHour, 0, 23],
                    ['Jam selesai', endHour, setEndHour, 1, 24]
                  ] as const
                ).map(([label, value, change, from, to]) => (
                  <div key={label} className="space-y-2">
                    <Label>{label}</Label>
                    <Select value={String(value)} onValueChange={(v) => change(Number(v))}>
                      <SelectTrigger className="w-full" aria-label={label}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: to - from + 1 }, (_, i) => i + from).map((h) => (
                          <SelectItem key={h} value={String(h)}>
                            {String(h).padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Hari aktif</legend>
              <div className="flex flex-wrap gap-2">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((name, i) => (
                  <label
                    key={name}
                    className={`relative cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${days.includes(i + 1) ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted/40'} has-focus-visible:ring-ring has-focus-visible:ring-2`}
                  >
                    <input
                      className="sr-only"
                      type="checkbox"
                      checked={days.includes(i + 1)}
                      onChange={(e) =>
                        setDays(
                          e.target.checked ? [...days, i + 1] : days.filter((d) => d !== i + 1)
                        )
                      }
                    />
                    {name}
                  </label>
                ))}
              </div>
              {!days.length && (
                <p className="text-destructive text-xs">Pilih minimal satu hari aktif.</p>
              )}
            </fieldset>
            {(endHour <= startHour || toDate < fromDate) && (
              <p role="alert" className="text-destructive text-sm">
                Tanggal dan jam selesai harus sesuai dengan waktu mulai.
              </p>
            )}
          </div>
          <aside className="bg-muted/25 space-y-5 border-t p-5 sm:p-6 lg:border-t-0 lg:border-l">
            <div className="space-y-2">
              <Label htmlFor="coaching-price">Harga per jam</Label>
              <div className="relative">
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  Rp
                </span>
                <Input
                  id="coaching-price"
                  type="number"
                  min={0}
                  max={2147483647}
                  required
                  value={price}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={`${priceInputClass} bg-background h-12 pl-10 text-lg font-semibold tabular-nums`}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Tarif berlaku untuk setiap slot satu jam. Isi 0 untuk layanan gratis.
              </p>
            </div>
            <dl className="space-y-3 border-y py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Durasi slot</dt>
                <dd className="font-medium">1 jam</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Hari aktif</dt>
                <dd className="font-medium">{days.length} hari / minggu</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tarif per slot</dt>
                <dd className="font-semibold">Rp {price.toLocaleString('id-ID')}</dd>
              </div>
            </dl>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Harga slot tersedia dalam periode ini akan diperbarui. Slot yang sudah dibooking atau
              ditutup tetap dipertahankan.
            </p>
            {(!branchId || branchId === 'all') && (
              <p className="text-sm">Pilih satu cabang di header untuk menyimpan perubahan.</p>
            )}
            <Button
              className="w-full"
              disabled={
                save.isPending ||
                !days.length ||
                endHour <= startHour ||
                toDate < fromDate ||
                !branchId ||
                branchId === 'all'
              }
            >
              {save.isPending ? 'Menyimpan...' : 'Simpan jadwal & harga'}
            </Button>
          </aside>
        </div>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Daftar slot layanan</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {dayjs(fromDate).format('DD MMM YYYY')} – {dayjs(toDate).format('DD MMM YYYY')} · Edit
            tarif atau buka/tutup slot per jam.
          </p>
        </div>
        <Badge variant="secondary">{schedule.data?.length ?? 0} slot</Badge>
      </div>
      <Dialog
        open={!!editingSlot}
        onOpenChange={(open) => {
          if (!open && !editPrice.isPending) setEditingSlot(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit harga slot</DialogTitle>
            <DialogDescription>Perubahan hanya berlaku untuk slot ini.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              editPrice.mutate();
            }}
          >
            <p className="text-muted-foreground text-sm">
              {editingSlot &&
                `${formatScheduleSlotTime(editingSlot.startAt, 'DD MMM YYYY')} · ${formatScheduleSlotTime(editingSlot.startAt)}–${formatScheduleSlotTime(editingSlot.endAt)} WIB`}
            </p>
            <div className="space-y-2">
              <Label htmlFor="slot-price">Harga per jam (Rp)</Label>
              <Input
                id="slot-price"
                type="number"
                min={0}
                max={2147483647}
                required
                value={slotPrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setSlotPrice(Number(e.target.value))}
                className={priceInputClass}
              />
            </div>
            <Button type="submit" disabled={editPrice.isPending}>
              {editPrice.isPending ? 'Menyimpan...' : 'Simpan harga'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {schedule.isError ? (
        <div role="alert">
          <p>Jadwal belum dapat dimuat.</p>
          <Button variant="outline" onClick={() => void schedule.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <div className="[&_thead]:bg-muted/50 min-w-0">
          <DataTable
            data={schedule.data ?? []}
            columns={columns}
            loading={schedule.isPending}
            searchPlaceholder="Cari jadwal..."
            enableRowSelection={false}
            getRowId={(slot) => slot.id}
            columnVisibilityLabel="Kolom"
            columnVisibilityStorageKey="quantum:coaching-schedule:columns"
          />
        </div>
      )}
    </main>
  );
}
