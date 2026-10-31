import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import RecurringBookingDialog from './RecurringBookingDialog';
import type * as DayjsModule from '@/lib/dayjs';
import type { BookingItem } from '@/stores/useBookingStore';

vi.mock('@/api/admin/court', () => ({
  getCourtsApi: vi.fn(async () => ({ data: [{ id: 'a', bookingWindowMonths: 3 }] })),
  getCourtsSlotsApi: vi.fn(async () => ({
    data: [
      {
        id: 'available',
        courtId: 'a',
        startAt: '2026-11-03 19:00:00',
        endAt: '2026-11-03 20:00:00',
        price: 200,
        isAvailable: true
      },
      {
        id: 'booked',
        courtId: 'a',
        startAt: '2026-11-10 19:00:00',
        endAt: '2026-11-10 20:00:00',
        price: 200,
        isAvailable: false
      }
    ]
  }))
}));
vi.mock('@/lib/dayjs', async (importOriginal) => {
  const actual = await importOriginal<typeof DayjsModule>();
  return { ...actual, nowJakarta: () => actual.default.tz('2026-10-29 10:00:00', 'Asia/Jakarta') };
});
afterEach(cleanup);
const templates: BookingItem[] = [
  {
    slotId: 'available',
    courtId: 'a',
    courtName: 'Court A',
    date: '2026-11-03',
    timeSlot: '19:00',
    endTime: '20:00',
    price: 200,
    sport: 'PADEL'
  }
];

it('requires consent to skip conflicts and invalidates preview after changing duration', async () => {
  const onApply = vi.fn();
  render(
    <RecurringBookingDialog
      templates={templates}
      startDate="2026-11-03"
      sport="PADEL"
      onApply={onApply}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Ulangi mingguan' }));
  await screen.findByRole('dialog');
  expect(screen.queryByLabelText('Tanggal akhir booking')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Periksa semua jadwal' }));
  const apply = await screen.findByRole('button', { name: 'Gunakan jadwal tersedia' });
  expect(apply).toBeDisabled();
  fireEvent.click(
    screen.getByLabelText('Lewati seluruh sesi yang tidak tersedia dan lanjutkan jadwal lainnya.')
  );
  expect(apply).toBeEnabled();
  fireEvent.change(screen.getByLabelText('Periode booking'), { target: { value: 'MONTHS' } });
  fireEvent.change(screen.getByLabelText('Durasi booking'), { target: { value: '1' } });
  expect(screen.queryByRole('button', { name: 'Gunakan jadwal tersedia' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Periksa semua jadwal' }));
  await screen.findByRole('button', { name: 'Gunakan jadwal tersedia' });
  fireEvent.click(
    screen.getByLabelText('Lewati seluruh sesi yang tidak tersedia dan lanjutkan jadwal lainnya.')
  );
  fireEvent.click(screen.getByRole('button', { name: 'Gunakan jadwal tersedia' }));
  await waitFor(() =>
    expect(onApply).toHaveBeenCalledWith(
      [expect.objectContaining({ slotId: 'available', date: '2026-11-03', price: 200 })],
      expect.objectContaining({
        mode: 'MONTHS',
        months: 1,
        previewThrough: '2026-12-03',
        sourceSlotIds: ['available']
      })
    )
  );
});

it('requires a source schedule before repeating', () => {
  render(
    <RecurringBookingDialog templates={[]} startDate="2026-11-03" sport="PADEL" onApply={vi.fn()} />
  );
  expect(screen.getByRole('button', { name: 'Ulangi mingguan' })).toBeDisabled();
});
