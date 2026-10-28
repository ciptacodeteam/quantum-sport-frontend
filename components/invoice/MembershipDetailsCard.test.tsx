import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import MembershipDetailsCard from './MembershipDetailsCard';
afterEach(cleanup);
it('shows only available invoice membership data without fake zeros or an assumed active status', () => {
  render(
    <MembershipDetailsCard
      membershipUser={{
        membership: { name: 'Paket Testing' },
        startDate: '2026-10-23T00:00:00Z',
        endDate: '2026-11-22T00:00:00Z'
      }}
    />
  );
  expect(screen.getByText('Paket Testing')).toBeInTheDocument();
  expect(screen.getByText('23 Okt 2026 - 22 Nov 2026')).toBeInTheDocument();
  expect(screen.queryByText('Aktif')).toBeNull();
  expect(screen.queryByText(/0 sesi|0 hari|Progres|Progress|Total Sesi/)).toBeNull();
});
it('shows purchased hours only when supplied and hides invalid dates', () => {
  render(
    <MembershipDetailsCard
      membershipUser={{
        membership: { name: 'Happy Hour', sessions: 20, duration: 30 },
        startDate: 'invalid'
      }}
    />
  );
  expect(screen.getByText('20 jam')).toBeInTheDocument();
  expect(screen.getByText('30 hari')).toBeInTheDocument();
  expect(screen.queryByText('Invalid Date')).toBeNull();
});
