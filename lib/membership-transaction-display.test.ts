import { describe, expect, it } from 'vitest';
import type { MembershipUser } from '@/types/model';
import { canManageMembership, membershipStatus } from './membership-transaction-display';

const transaction = (changes: Record<string, unknown> = {}) =>
  ({
    remainingSessions: 8,
    isExpired: false,
    isSuspended: false,
    invoice: { status: 'PAID' },
    ...changes
  }) as MembershipUser;

describe('Value Pack status and actions', () => {
  it.each([
    ['PENDING', 'Menunggu pembayaran'],
    ['AWAITING_CONFIRMATION', 'Menunggu pembayaran'],
    ['CANCELLED', 'Dibatalkan'],
    ['REFUNDED', 'Dibatalkan'],
    ['EXPIRED', 'Kedaluwarsa']
  ])('does not activate or suspend a %s purchase', (status, label) => {
    const item = transaction({ invoice: { status } });
    expect(membershipStatus(item)).toBe(label);
    expect(canManageMembership(item)).toBe(false);
  });
  it('prioritizes expiration and prevents actions for exhausted balances', () => {
    expect(membershipStatus(transaction({ isExpired: true, isSuspended: true }))).toBe(
      'Kedaluwarsa'
    );
    expect(canManageMembership(transaction({ isExpired: true }))).toBe(false);
    expect(membershipStatus(transaction({ remainingSessions: 0 }))).toBe('Sesi habis');
    expect(canManageMembership(transaction({ remainingSessions: 0 }))).toBe(false);
  });
  it('allows suspension and reactivation only for usable paid packs', () => {
    expect(membershipStatus(transaction())).toBe('Aktif');
    expect(membershipStatus(transaction({ isSuspended: true }))).toBe('Ditangguhkan');
    expect(canManageMembership(transaction())).toBe(true);
    expect(canManageMembership(transaction({ isSuspended: true }))).toBe(true);
  });
});

it('shows negative balance even after membership expiry', () => {
  expect(membershipStatus(transaction({ remainingSessions: -2, isExpired: true }))).toBe(
    'Saldo minus'
  );
});
