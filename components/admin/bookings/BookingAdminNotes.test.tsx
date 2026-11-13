import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { parseBookingAdminNote } from '@/lib/booking-admin-note';
import BookingAdminNotes from './BookingAdminNotes';

afterEach(cleanup);
const legacy =
  '[2026-11-13T06:23:29.460Z] Admin admin-id pindah lapangan: old-slot → new-slot; 2026-11-13 18:00:00 WIB; tanggal, jam dan biaya tetap.';
const audit = {
  at: '2026-11-13T07:24:12.841Z',
  actorId: 'admin-id',
  bookingId: 'booking',
  from: {
    court: 'Court 1',
    slotId: 'source',
    startAt: '2026-11-13T19:00:00+07:00',
    endAt: '2026-11-13T20:00:00+07:00'
  },
  to: {
    court: 'Court 5',
    slotId: 'target',
    startAt: '2026-11-13T19:00:00+07:00',
    endAt: '2026-11-13T20:00:00+07:00'
  }
};

it('separates manual notes from old and new audit events, showing newest first in WIB', () => {
  render(
    <BookingAdminNotes
      note={`Pelanggan minta lapangan berdekatan.\n${legacy}\n[COURT_CHANGE] ${JSON.stringify(audit)}`}
    />
  );
  expect(screen.getByRole('region', { name: 'Catatan admin' })).toHaveTextContent(
    'Pelanggan minta lapangan berdekatan.'
  );
  const items = within(screen.getByRole('region', { name: 'Riwayat perubahan' })).getAllByRole(
    'listitem'
  );
  expect(items).toHaveLength(2);
  expect(items[0]).toHaveTextContent('Court 1 → Court 5');
  expect(items[0]).toHaveTextContent('13 Nov 2026 · 14:24:12 WIB');
  expect(items[0]).toHaveTextContent('13 Nov 2026 · 19:00–20:00 WIB');
  expect(items[1]).toHaveTextContent('13 Nov 2026 · 13:23:29 WIB');
  expect(items[1]).toHaveTextContent('13 Nov 2026 · 18:00 WIB');
  expect(items[1]).toHaveTextContent('Nama lapangan tidak tercatat pada riwayat lama.');
  for (const item of items) {
    const technical = within(item).getByText('Detail teknis').closest('details');
    expect(technical).not.toHaveAttribute('open');
    expect(technical).toHaveTextContent('admin-id');
  }
});

it('renders reschedule history with both schedules and retains malformed records as notes', () => {
  const moved = {
    ...audit,
    to: { ...audit.to, startAt: '2026-11-14T18:00:00+07:00', endAt: '2026-11-14T19:00:00+07:00' }
  };
  const bad = '[COURT_RESCHEDULE] malformed';
  const parsed = parseBookingAdminNote(`${bad}\n[COURT_RESCHEDULE] ${JSON.stringify(moved)}`);
  expect(parsed.note).toBe(bad);
  expect(parsed.history[0]).toMatchObject({ title: 'Reschedule lapangan' });
  expect(parsed.history[0].description).toContain('Court 1 · 13 Nov 2026 · 19:00 WIB');
  expect(parsed.history[0].description).toContain('Court 5 · 14 Nov 2026 · 18:00–19:00 WIB');
});

it('keeps ordinary notes and does not invent history for invalid audit data', () => {
  const note = 'Catatan biasa\nBaris kedua\n[COURT_CHANGE] {"at":"invalid"}';
  render(<BookingAdminNotes note={note} />);
  expect(screen.getByRole('region', { name: 'Catatan admin' })).toHaveTextContent('Catatan biasa');
  expect(parseBookingAdminNote(note).note).toBe(note);
  expect(screen.queryByRole('region', { name: 'Riwayat perubahan' })).not.toBeInTheDocument();
});
