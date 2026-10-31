'use client';
import { useTariffPeriods } from '@/hooks/useTariffPeriods';
import { describeMembershipHours, type MembershipType } from '@/lib/membership-hours';
export function MembershipHoursDescription({
  type,
  sport = 'PADEL',
  shared = false,
  admin = false
}: {
  type: MembershipType;
  sport?: 'PADEL' | 'TENNIS';
  admin?: boolean;
  shared?: boolean;
}) {
  if (shared)
    return (
      <span>
        {type === 'ALL_HOUR'
          ? 'Berlaku pada seluruh jam operasional'
          : type === 'HAPPY_HOUR'
            ? 'Berlaku pada Happy Hour'
            : 'Berlaku pada Peak Hour'}
        . Jam mengikuti lokasi dan tanggal bermain.{' '}
        {sport === 'PADEL'
          ? 'Kuota bersama untuk Cemara dan S. Parman.'
          : 'Tennis tersedia di Cemara.'}
      </span>
    );
  return <LocalMembershipHours type={type} sport={sport} admin={admin} />;
}
function LocalMembershipHours({
  type,
  sport,
  admin
}: {
  type: MembershipType;
  sport: 'PADEL' | 'TENNIS';
  admin: boolean;
}) {
  const { rules, isError, isPending, branchId } = useTariffPeriods(admin);
  return (
    <>
      {!branchId || isError
        ? 'Mengikuti pengaturan jam tarif cabang'
        : isPending
          ? 'Memuat jam tarif...'
          : describeMembershipHours(type, rules, undefined, sport)}
    </>
  );
}
