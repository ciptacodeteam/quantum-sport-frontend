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
  const col = createColumnHelper<CoachingSlot>();
  const columns = [
    col.display({
      id: 'date',
      header: 'Tanggal',
      cell: ({ row }) => formatScheduleSlotTime(row.original.startAt, 'DD/MM/YYYY')
    }),
    col.display({
      id: 'time',
      header: 'Waktu (WIB)',
      cell: ({ row }) =>
        `${formatScheduleSlotTime(row.original.startAt)} - ${formatScheduleSlotTime(row.original.endAt)}`
    }),
    col.display({
      id: 'price',
      header: 'Harga per Jam',
      cell: ({ row }) => `Rp ${row.original.price.toLocaleString('id-ID')}`
    }),
    col.display({
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
    }),
    col.display({
      id: 'action',
      header: 'Aksi',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          disabled={row.original.booked || toggle.isPending || !branchId || branchId === 'all'}
          onClick={() => toggle.mutate(row.original)}
        >
          {row.original.isAvailable ? 'Tutup slot' : 'Buka slot'}
        </Button>
      )
    })
  ];
  if (isLoading || !hasAccess || person.isPending) return <p>Memuat...</p>;
  if (person.isError || !person.data)
    return <p role="alert">Profil tidak tersedia di cabang ini.</p>;
  return (
    <main className="space-y-6">
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
        className="space-y-5 rounded-xl border p-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <h2 className="font-semibold">Atur jadwal per jam</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          {(
            [
              ['Jam mulai', startHour, setStartHour, 0, 23],
              ['Jam selesai', endHour, setEndHour, 1, 24]
            ] as const
          ).map(([label, value, change, from, to]) => (
            <div key={label} className="space-y-2">
              <Label>{label}</Label>
              <Select value={String(value)} onValueChange={(v) => change(Number(v))}>
                <SelectTrigger aria-label={label}>
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
          <div className="space-y-2">
            <Label htmlFor="coaching-price">Harga per jam (Rp)</Label>
            <Input
              id="coaching-price"
              type="number"
              min={0}
              max={2147483647}
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
        </div>
        <fieldset className="flex flex-wrap gap-4">
          <legend className="mb-2 text-sm font-medium">Hari aktif</legend>
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((name, i) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={days.includes(i + 1)}
                onChange={(e) =>
                  setDays(e.target.checked ? [...days, i + 1] : days.filter((d) => d !== i + 1))
                }
              />
              {name}
            </label>
          ))}
        </fieldset>
        <p className="text-muted-foreground text-sm">
          Setiap slot berdurasi satu jam. Slot yang sudah dibooking atau ditutup tidak ditimpa.
        </p>
        {(!branchId || branchId === 'all') && (
          <p className="text-sm">Pilih satu cabang di header untuk menyimpan perubahan.</p>
        )}
        <Button
          disabled={
            save.isPending ||
            !days.length ||
            endHour <= startHour ||
            toDate < fromDate ||
            !branchId ||
            branchId === 'all'
          }
        >
          {save.isPending ? 'Menyimpan...' : 'Simpan jadwal'}
        </Button>
      </form>
      {schedule.isError ? (
        <div role="alert">
          <p>Jadwal belum dapat dimuat.</p>
          <Button variant="outline" onClick={() => void schedule.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <DataTable
          data={schedule.data ?? []}
          columns={columns}
          loading={schedule.isPending}
          enableRowSelection={false}
          enableColumnVisibility={false}
        />
      )}
    </main>
  );
}
