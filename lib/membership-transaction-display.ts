import type { MembershipUser } from '@/types/model';

export function membershipStatus(transaction: MembershipUser) {
  const payment = transaction.invoice?.status;
  if (['CANCELLED', 'REFUNDED', 'FAILED'].includes(payment || '')) return 'Dibatalkan';
  if (payment === 'EXPIRED') return 'Kedaluwarsa';
  if (payment !== 'PAID') return 'Menunggu pembayaran';
  if (transaction.remainingSessions < 0) return 'Saldo minus';
  if (transaction.isExpired) return 'Kedaluwarsa';
  if (transaction.isSuspended) return 'Ditangguhkan';
  if (transaction.remainingSessions <= 0) return 'Sesi habis';
  return 'Aktif';
}

export function canManageMembership(transaction: MembershipUser) {
  return (
    transaction.invoice?.status === 'PAID' &&
    !transaction.isExpired &&
    transaction.remainingSessions > 0
  );
}
