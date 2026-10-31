'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import DatePickerInput from '@/components/ui/date-picker-input';
import { getCourtsApi } from '@/api/admin/court';
import { Repeat2, CalendarDays } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import dayjs, { nowJakarta } from '@/lib/dayjs';
import {
  recurringPreviewEnd,
  type RecurringBookingRule,
  type RecurringSession
} from '@/lib/recurring-booking';
import type { Court } from '@/types/model';
import type { BookingItem } from '@/stores/useBookingStore';
import { toast } from 'sonner';

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

type Props = {
  templates: BookingItem[];
  membershipEligible?: boolean;
  startDate: string;
  sport: 'PADEL' | 'TENNIS';
  onApply: (items: BookingItem[], rule: RecurringBookingRule) => void;
};

export default function RecurringBookingDialog({
  templates,
  startDate,
  sport,
  onApply,
  membershipEligible = true
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'ROLLING' | 'MONTHS' | 'DATES'>('MONTHS');
  const [months, setMonths] = useState(1);
  const [customEnd, setCustomEnd] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [sessions, setSessions] = useState<RecurringSession[] | null>(null);
  const [skipConflicts, setSkipConflicts] = useState(false);
  const [loading, setLoading] = useState(false);
  // Freeze the source schedule while reviewing a preview.
  const [source, setSource] = useState<BookingItem[]>([]);
  const [sourceDate, setSourceDate] = useState('');
  const [error, setError] = useState('');

  const begin = async () => {
    setLoading(true);
    try {
      const response = await getCourtsApi({ courtSport: sport });
      const ids = new Set(templates.map((item) => item.courtId));
      const courts = (response.data as (Court & { bookingWindowMonths?: number | null })[]).filter(
        (court) => ids.has(court.id)
      );
      if (courts.length !== ids.size || courts.some((court) => !court.bookingWindowMonths)) {
        toast.error('Aktifkan rolling window untuk semua lapangan yang dipilih terlebih dahulu.');
        return;
      }
      const windowMonths = Math.min(...courts.map((court) => court.bookingWindowMonths!));
      const maximum = nowJakarta().add(windowMonths, 'month').format('YYYY-MM-DD');
      setMaxDate(maximum);
      setSource(templates);
      setSourceDate(startDate);
      setMode('MONTHS');
      setMonths(1);
      setCustomEnd(dayjs(startDate).add(1, 'month').format('YYYY-MM-DD'));
      setWeekdays([dayjs(startDate).day()]);
      setSessions(null);
      setSkipConflicts(false);
      setError('');
      setOpen(true);
    } catch {
      toast.error('Batas booking belum dapat dimuat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const endDate = recurringPreviewEnd(sourceDate, maxDate, mode, months, customEnd);

  const preview = async () => {
    setError('');
    setSessions(null);
    setSkipConflicts(false);
    if (
      !endDate ||
      endDate < sourceDate ||
      (mode === 'ROLLING' && endDate > maxDate) ||
      endDate > dayjs(sourceDate).add(12, 'month').format('YYYY-MM-DD') ||
      !weekdays.length
    ) {
      setError('Pilih hari bermain dan rentang yang valid, maksimal 12 bulan.');
      return;
    }
    setLoading(true);
    try {
      const response = await adminApi.post('/bookings/recurring/preview', {
        mode,
        ...(mode === 'MONTHS' ? { months } : {}),
        ...(mode === 'DATES' ? { endDate: customEnd } : {}),
        weekdays,
        startDate: sourceDate,
        previewThrough: endDate,
        sourceSlotIds: source.map((item) => item.slotId)
      });
      setSessions(response.data.data.sessions);
    } catch {
      setError('Jadwal belum dapat diperiksa. Periksa periode lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const available = sessions?.filter((session) => !session.conflicts.length) ?? [];
  const conflicts = sessions?.filter((session) => session.conflicts.length) ?? [];
  const items = available.flatMap((session) => session.items);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-primary/25 bg-background text-primary hover:bg-primary/10 h-10 w-full justify-center gap-3 px-4 shadow-xs"
        disabled={!templates.length || loading || !membershipEligible}
        onClick={begin}
      >
        <Repeat2 className="size-4 shrink-0" />
        {loading && !open ? 'Memuat…' : 'Ulangi mingguan'}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!loading) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="gap-2 border-b pb-5">
            <DialogTitle className="flex items-center gap-3">
              <Repeat2 className="text-primary size-5" />
              Booking berulang mingguan
            </DialogTitle>
            <DialogDescription>
              Ulangi lapangan dan jam yang dipilih pada {dayjs(sourceDate).format('DD MMM YYYY')}.
              Semua jam memakai WIB (Asia/Jakarta). Add-on hanya untuk booking awal.
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={loading} className="space-y-5">
            <legend className="mb-2 text-sm font-medium">Hari bermain</legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {days.map((day, index) => (
                <label
                  key={day}
                  className={`flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs transition-colors ${weekdays.includes(index) ? 'border-primary/40 bg-primary/5 text-primary font-medium' : 'hover:bg-muted/40'}`}
                >
                  <input
                    type="checkbox"
                    className="accent-primary size-3.5"
                    checked={weekdays.includes(index)}
                    onChange={() => {
                      setWeekdays((previous) =>
                        previous.includes(index)
                          ? previous.filter((value) => value !== index)
                          : [...previous, index]
                      );
                      setSessions(null);
                    }}
                  />
                  {day}
                </label>
              ))}
            </div>
            <div
              className={`grid items-start gap-4 ${mode === 'MONTHS' ? 'sm:grid-cols-[minmax(0,1fr)_9rem]' : ''}`}
            >
              <div className="flex min-w-0 flex-col gap-2">
                <label htmlFor="recurring-period" className="text-sm font-medium">
                  Periode booking
                </label>
                <Select
                  disabled={loading}
                  value={mode}
                  onValueChange={(value) => {
                    setMode(value as 'ROLLING' | 'MONTHS' | 'DATES');
                    setSessions(null);
                  }}
                >
                  <SelectTrigger
                    id="recurring-period"
                    aria-label="Periode booking"
                    className="w-full min-w-0 gap-4 px-3 data-[size=default]:h-10 [&>span]:min-w-0 [&>span]:truncate"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="ROLLING">Ikuti rolling window</SelectItem>
                    <SelectItem value="MONTHS">Durasi beberapa bulan</SelectItem>
                    <SelectItem value="DATES">Sampai tanggal tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {mode === 'MONTHS' && (
                <div className="flex min-w-0 flex-col gap-2">
                  <label htmlFor="recurring-duration" className="text-sm font-medium">
                    Durasi
                  </label>
                  <Select
                    disabled={loading}
                    value={String(months)}
                    onValueChange={(value) => {
                      setMonths(Number(value));
                      setSessions(null);
                    }}
                  >
                    <SelectTrigger
                      id="recurring-duration"
                      aria-label="Durasi booking"
                      className="w-full gap-4 px-3 data-[size=default]:h-10"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1} bulan
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {mode === 'DATES' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="recurring-end-date" className="text-sm font-medium">
                  Sampai tanggal
                </label>
                <DatePickerInput
                  id="recurring-end-date"
                  className="w-full sm:w-full"
                  value={customEnd ? dayjs(customEnd).toDate() : undefined}
                  minDate={dayjs(sourceDate).toDate()}
                  maxDate={dayjs(sourceDate).add(12, 'month').toDate()}
                  onValueChange={(date) => {
                    setCustomEnd(date ? dayjs(date).format('YYYY-MM-DD') : '');
                    setSessions(null);
                  }}
                />
              </div>
            )}
            <p className="text-muted-foreground text-xs leading-relaxed">
              {mode === 'ROLLING'
                ? 'Tanpa tanggal berhenti. Jadwal baru ditambahkan saat rolling window bergerak.'
                : 'Seluruh rentang ini dibuat saat checkout, termasuk tanggal yang belum diterbitkan. Setiap tanggal bermain memiliki booking dan invoice terpisah.'}{' '}
            </p>
            <p className="bg-muted/40 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs">
              <CalendarDays className="text-muted-foreground size-4 shrink-0" />
              Pratinjau: {dayjs(sourceDate).format('DD MMM YYYY')} —{' '}
              {dayjs(endDate).format('DD MMM YYYY')}.
            </p>
            <p className="text-muted-foreground rounded-lg border p-3 text-xs leading-relaxed">
              Khusus pelanggan membership. Kuota dipotong ketika masing-masing slot dimulai (WIB),
              boleh minus, dan aturan tetap berjalan meskipun masa membership habis. Add-on tidak
              diulang otomatis.
            </p>
            <Button
              type="button"
              className="h-10 w-full gap-2"
              onClick={preview}
              disabled={loading}
            >
              {loading ? 'Memeriksa…' : 'Periksa semua jadwal'}
            </Button>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {sessions && (
            <div className="space-y-3" aria-live="polite">
              <p className="text-sm font-medium">
                {available.length} sesi tersedia · {conflicts.length} sesi tidak tersedia ·{' '}
                {items.length} slot
              </p>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded border p-3 text-sm">
                {sessions.map((session) => (
                  <div key={session.date} className="border-b pb-2 last:border-0">
                    <p className="font-medium">{dayjs(session.date).format('dddd, DD MMM YYYY')}</p>
                    {session.conflicts.length ? (
                      <p className="text-red-600">Dilewati: {session.conflicts.join('; ')}</p>
                    ) : (
                      <>
                        <p>
                          {session.items
                            .map((item) => `${item.courtName} ${item.timeSlot}`)
                            .join(', ')}
                        </p>
                        <p>
                          Rp
                          {session.items
                            .reduce((sum, item) => sum + item.price, 0)
                            .toLocaleString('id-ID')}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {conflicts.length > 0 && (
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={skipConflicts}
                    onChange={(event) => setSkipConflicts(event.target.checked)}
                  />
                  Lewati seluruh sesi yang tidak tersedia dan lanjutkan jadwal lainnya.
                </label>
              )}
              <p className="font-semibold">
                Nilai normal jadwal tersedia: Rp{total.toLocaleString('id-ID')}
              </p>
              <p className="text-muted-foreground text-xs">
                Jadwal awal masuk keranjang. Pengulangan dibuat terpisah saat checkout dan belum
                ditahan sebelum checkout.
              </p>
              <Button
                type="button"
                disabled={loading || !items.length || (!!conflicts.length && !skipConflicts)}
                onClick={() => {
                  onApply(source, {
                    mode,
                    ...(mode === 'MONTHS' ? { months } : {}),
                    ...(mode === 'DATES' ? { endDate: customEnd } : {}),
                    skipConflicts,
                    weekdays,
                    startDate: sourceDate,
                    previewThrough: endDate,
                    sourceSlotIds: source.map((item) => item.slotId)
                  });
                  setOpen(false);
                  toast.success(
                    'Rentang mingguan dipilih. Booking dan invoice per tanggal dibuat setelah checkout.'
                  );
                }}
              >
                Gunakan jadwal tersedia
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
