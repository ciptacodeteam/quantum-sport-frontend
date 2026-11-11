import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingInHouseSelection, { usableInHouseWallets } from './BookingInHouseSelection';
import type { InHouseWallet, InHousePlan } from '@/api/admin/inhouseCoaching';
vi.mock('@/hooks/useAdminCourtSports', () => ({
  useAdminCourtSports: () => ({ branchId: 'cemara' })
}));
vi.mock('@tanstack/react-query', () => ({
  queryOptions: (options: unknown) => options,
  useQuery: () => ({
    data: [
      {
        slotId: 'coach-slot',
        coach: { id: 'andi', isInHouseCoach: true },
        price: 400000,
        additionalHourPrice: 100000
      }
    ],
    isFetching: false
  })
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
  _count: { usages: 2 },
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
  expect(screen.getByRole('button', { name: /Andi.*Andi 5 jam/ })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  fireEvent.click(screen.getByRole('button', { name: /Andi.*Andi 5 jam/ }));
  fireEvent.change(screen.getByLabelText('Jumlah peserta'), { target: { value: '3' } });
  expect(screen.getByText('Tambahan peserta')).toBeInTheDocument();
  expect(screen.getAllByText(/200.000/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Gunakan paket untuk jam ini' }));
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
  fireEvent.click(screen.getByRole('button', { name: /Andi.*Andi 5 jam/ }));
  expect(screen.getByRole('button', { name: 'Gunakan paket untuk jam ini' })).toBeDisabled();
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
  for (let index = 0; index < 2; index++) {
    if (index)
      fireEvent.click(screen.getByRole('button', { name: 'Court A · 2040-11-03 · 19:00 - 20:00' }));
    fireEvent.click(screen.getByRole('button', { name: /Andi.*tarif dasar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Terapkan coach ke jam ini' }));
    expect(change).toHaveBeenLastCalledWith(sessions[index], {
      planId: 'single',
      courtSlotId: sessions[index].slotId,
      coachSlotId: 'coach-slot',
      participants: 1
    });
  }
});

it('offers an in-house coach without any customer package using the scheduled hourly price', async () => {
  const change = vi.fn();
  render(
    <BookingInHouseSelection
      wallets={[]}
      coaches={[
        {
          id: 'andi',
          name: 'Andi',
          isInHouseCoach: true,
          isActive: true,
          role: 'COACH',
          coachType: 'PADEL'
        } as any
      ]}
      sessions={[session]}
      selected={[]}
      onChange={change}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /Andi.*bayar per sesi/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Terapkan coach ke jam ini' }));
  expect(change).toHaveBeenCalledWith(
    session,
    expect.objectContaining({
      staffId: 'andi',
      coachSlotId: 'coach-slot',
      courtSlotId: 'court-slot',
      hourlyPrice: 400000,
      participants: 1
    })
  );
  expect(change.mock.calls[0][1]).not.toHaveProperty('walletId');
  expect(change.mock.calls[0][1]).not.toHaveProperty('planId');
});

const coach = {
  branchId: 'cemara',
  phone: null,
  coachProfile: null,
  id: 'andi',
  name: 'Andi',
  isInHouseCoach: true,
  isActive: true,
  role: 'COACH' as const,
  coachType: 'PADEL' as const
};
it('separates single coaches from prepaid packages without applying a choice on mode change', () => {
  const change = vi.fn();
  render(
    <BookingInHouseSelection
      wallets={[wallet]}
      coaches={[coach]}
      sessions={[session]}
      selected={[]}
      onChange={change}
    />
  );
  expect(screen.getByRole('group', { name: 'Daftar coach satuan' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Andi 5 jam/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Paket customer.*kuota/ }));
  expect(screen.getByRole('button', { name: /Andi.*Andi 5 jam/ })).toBeInTheDocument();
  expect(change).not.toHaveBeenCalled();
});
it('shows the continuation rate and total for the next consecutive hour', () => {
  const second = { ...session, slotId: 'next', timeSlot: '19:00 - 20:00' };
  render(
    <BookingInHouseSelection
      wallets={[]}
      coaches={[coach]}
      sessions={[session, second]}
      selected={[
        {
          staffId: 'andi',
          courtSlotId: session.slotId,
          coachSlotId: 'previous-coach-slot',
          hourlyPrice: 400000,
          additionalHourPrice: 100000,
          participants: 1
        }
      ]}
      onChange={vi.fn()}
    />
  );
  expect(screen.getByText('Coach sudah diterapkan')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Court A · 2040-11-03 · 19:00 - 20:00' }));
  fireEvent.click(screen.getByRole('button', { name: /Andi.*bayar per sesi/ }));
  const coachRow = screen.getByText('Coach · 1 jam').parentElement!;
  expect(within(coachRow).getByText(/100.000/)).toBeInTheDocument();
  const totalRow = screen.getByText('Total sesi ini').parentElement!;
  expect(within(totalRow).getByText(/400.000/)).toBeInTheDocument();
});
