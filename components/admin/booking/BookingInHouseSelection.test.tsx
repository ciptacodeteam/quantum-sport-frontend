import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingInHouseSelection, { usableInHouseWallets } from './BookingInHouseSelection';
import type { InHouseWallet, InHousePlan } from '@/api/admin/inhouseCoaching';
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [{ slotId: 'coach-slot', coach: { id: 'andi' } }], isFetching: false })
}));
beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const wallet: InHouseWallet = {
  id: 'wallet',
  userId: 'customer',
  staffId: 'andi',
  packageName: 'Andi 5 jam',
  totalMinutes: 300,
  remainingMinutes: 180,
  hourlyPrice: 900000,
  courtHourlyShare: 250000,
  extraParticipantHourlyPrice: 100000,
  user: { id: 'customer', name: 'Budi', phone: '08123456789' },
  staff: { id: 'andi', name: 'Andi', coachType: 'PADEL', isActive: true },
  invoice: { id: 'invoice', number: 'INV', status: 'PAID', total: 4500000 }
};
const session = {
  slotId: 'court-slot',
  courtId: 'court',
  courtName: 'Court A',
  date: '2040-11-03',
  timeSlot: '18:00 - 19:00',
  endTime: '19:00',
  price: 300000
};
it('hides package coaching when the customer has no eligible package', () => {
  expect(
    usableInHouseWallets(
      [
        { ...wallet, remainingMinutes: 0 },
        { ...wallet, invoice: null },
        { ...wallet, staff: { ...wallet.staff, coachType: 'TENNIS' } }
      ],
      'PADEL'
    )
  ).toEqual([]);
  render(
    <BookingInHouseSelection wallets={[]} sessions={[session]} selected={[]} onChange={vi.fn()} />
  );
  expect(screen.queryByRole('region', { name: 'Paket coach in-house' })).not.toBeInTheDocument();
});
it('does not automatically select a package and submits the coach tied to the explicit choice', async () => {
  const change = vi.fn();
  render(
    <BookingInHouseSelection
      wallets={[wallet]}
      sessions={[session]}
      selected={[]}
      onChange={change}
    />
  );
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Paket customer')).toHaveTextContent('Tanpa paket in-house');
  fireEvent.click(screen.getByRole('combobox', { name: 'Paket customer' }));
  fireEvent.click(await screen.findByRole('option', { name: /Andi.*Andi 5 jam/ }));
  fireEvent.change(screen.getByLabelText('Peserta'), { target: { value: '3' } });
  expect(screen.getByText(/Tambahan peserta:.*200.000/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Gunakan paket' }));
  expect(change).toHaveBeenCalledWith(session, {
    walletId: 'wallet',
    courtSlotId: 'court-slot',
    coachSlotId: 'coach-slot',
    participants: 3
  });
});
it('counts other selected hours so the same quota cannot be over-selected', async () => {
  render(
    <BookingInHouseSelection
      wallets={[{ ...wallet, remainingMinutes: 60 }]}
      sessions={[session]}
      selected={[
        {
          walletId: 'wallet',
          courtSlotId: 'another-court',
          coachSlotId: 'other-slot',
          participants: 1
        }
      ]}
      onChange={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Paket customer' }));
  fireEvent.click(await screen.findByRole('option', { name: /Andi.*Andi 5 jam/ }));
  expect(screen.getByRole('button', { name: 'Gunakan paket' })).toBeDisabled();
  expect(screen.getByText('Sisa kuota tidak cukup untuk pilihan jam ini.')).toBeInTheDocument();
});

const singlePlan: InHousePlan = {
  id: 'single',
  staffId: 'andi',
  name: 'Andi satuan',
  hours: 1,
  hourlyPrice: 1000000,
  courtHourlyShare: 250000,
  extraParticipantHourlyPrice: 100000,
  isActive: true,
  staff: wallet.staff
};
it('offers direct coaching without a prepaid wallet and sends the single-hour tariff for each court hour', async () => {
  const change = vi.fn();
  const sessions = [session, { ...session, slotId: 'second-hour', timeSlot: '19:00 - 20:00' }];
  render(
    <BookingInHouseSelection
      wallets={[]}
      plans={[singlePlan]}
      sessions={sessions}
      selected={[]}
      onChange={change}
    />
  );
  expect(change).not.toHaveBeenCalled();
  const dropdowns = screen.getAllByRole('combobox', { name: 'Coaching satuan / paket' });
  for (let index = 0; index < 2; index++) {
    fireEvent.click(dropdowns[index]);
    fireEvent.click(await screen.findByRole('option', { name: /Andi.*Coaching satuan/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Pilih coaching satuan' })[index]);
    expect(change).toHaveBeenLastCalledWith(sessions[index], {
      planId: 'single',
      courtSlotId: sessions[index].slotId,
      coachSlotId: 'coach-slot',
      participants: 1
    });
  }
});
