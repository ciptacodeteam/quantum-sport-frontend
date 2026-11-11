'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { coachingApi, type CoachingSlot } from '@/api/admin/coaching';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatScheduleSlotTime } from '@/lib/admin-schedule-time';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { coachingSportLabel } from './CoachingCatalog';
import { toast } from 'sonner';
import InHouseCoachPlans from './InHouseCoachPlans';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

const priceInputClass =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export default function CoachingSchedule({
  staffId,
  groupId
}: {
  staffId: string;
  groupId?: string;
}) {
  const { hasAccess, isLoading } = useRoleAccess({ allowedRoles: ['ADMIN'] });
  const { branchId } = useAdminCourtSports();
  const client = useQueryClient();
  const [sectionTab, setSectionTab] = useState('schedule');
  const [days, setDays] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [startHour, setStartHour] = useState(6),
    [endHour, setEndHour] = useState(24),
    [price, setPrice] = useState(0);
  const [additionalHourPrice, setAdditionalHourPrice] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<CoachingSlot | null>(null);
  const [slotPrice, setSlotPrice] = useState(0);
  const person = useQuery({
    queryKey: ['admin', 'coaching', branchId, staffId],
    queryFn: () => coachingApi.person(staffId),
    enabled: hasAccess
  });
  useEffect(() => {
    const rule = person.data?.rollingServiceSchedule;
    setDays(rule?.days ?? [1, 2, 3, 4, 5, 6, 7]);
    setStartHour(rule?.startHour ?? 6);
    setEndHour(rule?.endHour ?? 24);
    setPrice(rule?.price ?? 0);
    setAdditionalHourPrice(rule?.additionalHourPrice ?? null);
  }, [staffId, branchId, person.data?.rollingServiceSchedule]);
  const schedule = useQuery({
    queryKey: ['admin', 'coaching', branchId, staffId, 'schedule', 'rolling'],
    queryFn: () => coachingApi.schedule(staffId),
    enabled: hasAccess
  });
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: ['admin', 'coaching'] });
  };
  const save = useMutation({
    mutationFn: () =>
      coachingApi.saveSchedule(staffId, {
        followCourtWindow: true,
        days,
        startHour,
        endHour,
        price,
        ...(person.data?.role === 'COACH' ? { additionalHourPrice } : {})
      }),
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
      header: person.data?.role === 'COACH' ? 'Tarif Coach' : 'Harga per Jam',
      cell: ({ row }) => (
        <div>
          <span>
            Rp {row.original.price.toLocaleString('id-ID')}
            {person.data?.role === 'COACH' ? ' / jam pertama' : ''}
          </span>
          {person.data?.role === 'COACH' && row.original.additionalHourPrice != null && (
            <p className="text-muted-foreground text-xs">
              Berikutnya Rp {row.original.additionalHourPrice.toLocaleString('id-ID')}/jam
            </p>
          )}
        </div>
      )
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
        <Link
          href={
            person.data.role === 'COACH'
              ? person.data.isInHouseCoach
                ? '/admin/coach-inhouse'
                : groupId
                  ? `/admin/coaching-groups/${encodeURIComponent(groupId)}`
                  : '/admin/coaching-groups'
              : '/admin/coaching?kind=BALLBOY'
          }
        >
          ← Kembali ke{' '}
          {person.data.isInHouseCoach
            ? 'Coach In-house'
            : person.data.role === 'COACH'
              ? 'Grup Coaching'
              : 'Ballboy'}
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Jadwal & Harga · {person.data.name}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {person.data.role === 'BALLBOY'
            ? 'Ballboy · Padel & Tennis'
            : `Coach · ${coachingSportLabel(person.data.coachType)}`}{' '}
          · Waktu dalam WIB
        </p>
      </div>
      {person.data.isInHouseCoach && (
        <nav
          aria-label="Pengaturan coach in-house"
          className="bg-muted/35 flex w-fit max-w-full flex-wrap gap-1 rounded-md p-1"
        >
          {(
            [
              ['schedule', 'Jadwal & Harga'],
              ['packages', 'Paket & Tarif']
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant="ghost"
              data-admin-tab
              aria-pressed={sectionTab === value}
              className={`h-9 rounded-sm border-0 px-3 shadow-none ${sectionTab === value ? 'bg-primary/5 text-primary' : 'text-muted-foreground'}`}
              onClick={() => setSectionTab(value)}
            >
              {label}
            </Button>
          ))}
        </nav>
      )}
      {person.data.isInHouseCoach && sectionTab === 'packages' ? (
        <InHouseCoachPlans key={`${branchId}:${staffId}`} coach={person.data} />
      ) : (
        <>
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
                Atur hari, jam layanan, dan tarif. Periode otomatis mengikuti rolling window
                lapangan.
              </p>
            </div>
            <div className="grid xl:grid-cols-[minmax(0,3fr)_minmax(400px,2fr)]">
              <div className="min-w-0 space-y-6 p-5 sm:p-6">
                <section
                  aria-label="Periode layanan"
                  className="bg-primary/5 border-primary/20 space-y-2 rounded-xl border p-4"
                >
                  <h3 className="text-sm font-semibold">Periode layanan otomatis</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Mengikuti jadwal rolling window lapangan di cabang ini sesuai olahraga layanan.
                    Slot layanan bertambah otomatis saat jadwal lapangan diperpanjang.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Tidak perlu mengatur tanggal ketersediaan.
                  </p>
                </section>
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
                        <Select
                          value={String(value)}
                          onValueChange={(v) => {
                            if (v) change(Number(v));
                          }}
                        >
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
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(
                      (name, i) => (
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
                                e.target.checked
                                  ? [...days, i + 1]
                                  : days.filter((d) => d !== i + 1)
                              )
                            }
                          />
                          {name}
                        </label>
                      )
                    )}
                  </div>
                  {!days.length && (
                    <p className="text-destructive text-xs">Pilih minimal satu hari aktif.</p>
                  )}
                </fieldset>
                {endHour <= startHour && (
                  <p role="alert" className="text-destructive text-sm">
                    Jam selesai harus setelah jam mulai.
                  </p>
                )}
              </div>
              <aside className="bg-muted/25 min-w-0 space-y-5 border-t p-5 sm:p-6 xl:border-t-0 xl:border-l">
                <div className="space-y-2">
                  <Label htmlFor="coaching-price">
                    {person.data.role === 'COACH' ? 'Harga jam pertama' : 'Harga per jam'}
                  </Label>
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
                    {person.data.role === 'COACH'
                      ? 'Harga normal untuk satu jam pertama pada setiap rangkaian sesi.'
                      : 'Tarif berlaku untuk setiap slot satu jam. Isi 0 untuk layanan gratis.'}
                  </p>
                </div>
                {person.data.role === 'COACH' && (
                  <div className="space-y-2">
                    <Label htmlFor="coaching-additional-price">Harga per jam berikutnya</Label>
                    <div className="relative">
                      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                        Rp
                      </span>
                      <Input
                        id="coaching-additional-price"
                        type="number"
                        min={0}
                        max={2147483647}
                        placeholder="Sama dengan jam pertama"
                        value={additionalHourPrice ?? ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setAdditionalHourPrice(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className={`${priceInputClass} bg-background h-12 pl-10 text-lg font-semibold tabular-nums`}
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Berlaku mulai jam kedua untuk coach yang sama dan jam berurutan. Kosongkan
                      untuk memakai harga normal. Isi 0 untuk jam tambahan gratis.
                    </p>
                    <p className="text-sm font-medium">
                      Contoh 3 jam: Rp{' '}
                      {(price + 2 * (additionalHourPrice ?? price)).toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
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
                    <dt className="text-muted-foreground">
                      {person.data.role === 'COACH' ? 'Jam pertama' : 'Tarif per slot'}
                    </dt>
                    <dd className="font-semibold">Rp {price.toLocaleString('id-ID')}</dd>
                  </div>
                </dl>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Harga slot tersedia dalam rolling window akan diperbarui. Slot yang sudah
                  dibooking atau ditutup tetap dipertahankan.
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
                Mengikuti rolling window lapangan · Edit tarif atau buka/tutup slot per jam.
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
        </>
      )}
    </main>
  );
}
