import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), role: vi.fn() }));
vi.mock('@/api/admin/booking', () => ({ updateBookingDescriptionApi: mocks.update }));
vi.mock('@/hooks/useRoleAccess', () => ({ useHasRole: mocks.role }));
import BookingDescription from './BookingDescription';
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.role.mockReturnValue(true);
});
const onSuccess = vi.fn();
function mount(note: string | null = 'Pak Alvin') {
  render(<BookingDescription bookingId="booking" note={note} onSuccess={onSuccess} />);
}
it('edits an existing description, displays the saved text and refreshes booking data', async () => {
  mocks.update.mockResolvedValue({ data: { adminNote: 'Pak Alvin baru' } });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Edit description' }));
  const field = screen.getByRole('textbox', { name: 'Description' });
  expect(field).toHaveValue('Pak Alvin');
  fireEvent.change(field, { target: { value: 'Pak Alvin baru' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan description' }));
  await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
  expect(screen.getByText('Pak Alvin baru')).toBeInTheDocument();
  expect(mocks.update).toHaveBeenCalledWith('booking', {
    description: 'Pak Alvin baru',
    expectedAdminNote: 'Pak Alvin'
  });
  expect(onSuccess).toHaveBeenCalledOnce();
});
it('cancels edits without saving and supports adding a missing description', () => {
  mount(null);
  fireEvent.click(screen.getByRole('button', { name: 'Edit description' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
  expect(screen.getByText('Belum ada description.')).toBeInTheDocument();
  expect(mocks.update).not.toHaveBeenCalled();
});
it('retains the draft and shows an error if saving fails', async () => {
  mocks.update.mockRejectedValue({ message: 'Description sudah berubah.' });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Edit description' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan description' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Description sudah berubah.');
  expect(screen.getByRole('textbox')).toHaveValue('draft');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Simpan description' })).toBeEnabled()
  );
  expect(onSuccess).not.toHaveBeenCalled();
});
it('keeps descriptions readable without an edit action for viewers', () => {
  mocks.role.mockReturnValue(false);
  mount();
  expect(screen.getByText('Pak Alvin')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit description' })).not.toBeInTheDocument();
});

it('keeps court-change history visible but outside the editable description', () => {
  const history =
    '[COURT_CHANGE] ' +
    JSON.stringify({
      at: '2026-11-18T01:00:00Z',
      actorId: 'admin',
      from: {
        court: 'Court 1',
        startAt: '2026-11-18T09:00:00+07:00',
        endAt: '2026-11-18T10:00:00+07:00'
      },
      to: {
        court: 'Court 2',
        startAt: '2026-11-18T09:00:00+07:00',
        endAt: '2026-11-18T10:00:00+07:00'
      }
    });
  mount('Pak Alvin\n' + history);
  expect(screen.getByText('Pindah lapangan')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit description' }));
  expect(screen.getByRole('textbox')).toHaveValue('Pak Alvin');
  expect(screen.getByText('Pindah lapangan')).toBeInTheDocument();
});
