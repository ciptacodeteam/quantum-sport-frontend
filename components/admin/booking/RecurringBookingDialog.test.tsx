import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import RecurringBookingDialog from './RecurringBookingDialog';
import type * as DayjsModule from '@/lib/dayjs';
import type { BookingItem } from '@/stores/useBookingStore';

const mocks = vi.hoisted(() => ({
  preview: vi.fn(async () => ({
    data: {
      data: {
        sessions: [
          {
            date: '2026-11-03',
            conflicts: [],
            items: [
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
            ]
          },
          { date: '2026-11-10', conflicts: ['Court A tidak tersedia'], items: [] }
        ]
      }
    }
  }))
}));
vi.mock('@/lib/adminApi', () => ({ adminApi: { post: mocks.preview } }));
vi.mock('@/api/admin/court', () => ({
  getCourtsApi: vi.fn(async () => ({ data: [{ id: 'a', bookingWindowMonths: 1 }] }))
}));
vi.mock('@/lib/dayjs', async (importOriginal) => {
  const actual = await importOriginal<typeof DayjsModule>();
  return { ...actual, nowJakarta: () => actual.default.tz('2026-10-29 10:00:00', 'Asia/Jakarta') };
});
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
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
  fireEvent.keyDown(screen.getByLabelText('Periode booking'), { key: 'Enter' });
  fireEvent.click(await screen.findByRole('option', { name: 'Durasi beberapa bulan' }));
  fireEvent.keyDown(screen.getByLabelText('Durasi booking'), { key: 'Enter' });
  fireEvent.click(await screen.findByRole('option', { name: '3 bulan' }));
  expect(screen.queryByRole('button', { name: 'Gunakan jadwal tersedia' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Periksa semua jadwal' }));
  await screen.findByRole('button', { name: 'Gunakan jadwal tersedia' });
  fireEvent.click(
    screen.getByLabelText('Lewati seluruh sesi yang tidak tersedia dan lanjutkan jadwal lainnya.')
  );
  fireEvent.click(screen.getByRole('button', { name: 'Gunakan jadwal tersedia' }));
  expect(mocks.preview).toHaveBeenLastCalledWith(
    '/bookings/recurring/preview',
    expect.objectContaining({ months: 3, previewThrough: '2027-02-03' })
  );
  await waitFor(() =>
    expect(onApply).toHaveBeenCalledWith(
      templates,
      expect.objectContaining({
        mode: 'MONTHS',
        months: 3,
        previewThrough: '2027-02-03',
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
