'use client';

import { useState } from 'react';
import { getCourtsSlotsApi, getCourtsApi } from '@/api/admin/court';
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
  previewRecurringBooking,
  recurringDates,
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
  const [mode, setMode] = useState<'ROLLING' | 'MONTHS'>('ROLLING');
  const [months, setMonths] = useState(6);
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
      setMode('ROLLING');
      setMonths(6);
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

  const endDate = recurringPreviewEnd(sourceDate, maxDate, mode, months);

  const preview = async () => {
    setError('');
    setSessions(null);
    setSkipConflicts(false);
    if (!endDate || endDate < sourceDate || endDate > maxDate || !weekdays.length) {
      setError('Pilih minimal satu hari bermain dalam batas rolling window.');
      return;
    }
    setLoading(true);
    try {
      const dates = recurringDates(sourceDate, endDate, weekdays);
      if (!dates.length) throw new Error('Tidak ada jadwal pada periode ini.');
      const response = await getCourtsSlotsApi({
        startAt: `${sourceDate} 00:00:00`,
        endAt: `${endDate} 23:59:59`,
        courtSport: sport,
        includeUnavailable: 'true'
      });
      setSessions(previewRecurringBooking(source, dates, response.data, nowJakarta().valueOf()));
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
        size="sm"
        disabled={!templates.length || loading || !membershipEligible}
        onClick={begin}
      >
        {loading && !open ? 'Memuat…' : 'Ulangi mingguan'}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!loading) setOpen(value);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Booking berulang mingguan</DialogTitle>
            <DialogDescription>
              Ulangi lapangan dan jam yang dipilih pada {dayjs(sourceDate).format('DD MMM YYYY')}.
              Harga mengikuti setiap tanggal. Add-on dipilih terpisah.
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={loading} className="space-y-4">
            <legend className="mb-2 text-sm font-medium">Hari bermain</legend>
            <div className="flex flex-wrap gap-2">
              {days.map((day, index) => (
                <label key={day} className="flex items-center gap-2 rounded border p-2 text-sm">
                  <input
                    type="checkbox"
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
            <label className="block space-y-2 text-sm">
              Periode booking
              <select
                aria-label="Periode booking"
                className="block w-full rounded border p-2"
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as 'ROLLING' | 'MONTHS');
                  setSessions(null);
                }}
              >
                <option value="ROLLING">Ikuti rolling window — tanpa tanggal berhenti</option>
                <option value="MONTHS">Durasi beberapa bulan</option>
              </select>
            </label>
            {mode === 'MONTHS' && (
              <label className="block space-y-2 text-sm">
                Durasi
                <select
                  aria-label="Durasi booking"
                  className="block w-full rounded border p-2"
                  value={months}
                  onChange={(event) => {
                    setMonths(Number(event.target.value));
                    setSessions(null);
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} bulan
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="text-muted-foreground text-xs">
              {mode === 'ROLLING'
                ? 'Jadwal otomatis diperpanjang mengikuti rolling window sampai admin menghentikannya.'
                : `Booking berjalan selama ${months} bulan dari jadwal awal. Jadwal di luar window akan ditambahkan saat tersedia.`}{' '}
              Pratinjau saat ini: {sourceDate} sampai {endDate}.
            </p>
            <p className="rounded border p-3 text-xs">
              Khusus pelanggan membership. Kuota dipotong saat jam bermain, boleh minus, dan aturan
              tetap berjalan meskipun masa membership habis. Add-on tidak diulang otomatis.
            </p>
            <Button type="button" onClick={preview} disabled={loading}>
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
                Total jadwal tersedia: Rp{total.toLocaleString('id-ID')}
              </p>
              <p className="text-muted-foreground text-xs">
                Slot yang sudah dipilih tidak digandakan. Jadwal dikonfirmasi ulang saat checkout
                dan belum ditahan sebelum checkout.
              </p>
              <Button
                type="button"
                disabled={loading || !items.length || (!!conflicts.length && !skipConflicts)}
                onClick={() => {
                  onApply(items, {
                    mode,
                    ...(mode === 'MONTHS' ? { months } : {}),
                    weekdays,
                    startDate: sourceDate,
                    previewThrough: endDate,
                    sourceSlotIds: source.map((item) => item.slotId)
                  });
                  setOpen(false);
                  toast.success('Jadwal berulang ditambahkan. Tinjau keranjang sebelum checkout.');
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
