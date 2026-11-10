import dayjs from '@/lib/dayjs';

export const RESCHEDULE_NOTICE = 'Reschedule maksimal H-2 (minimal 48 jam sebelum jadwal asal).';

export const SUPER_ADMIN_RESCHEDULE_NOTICE =
  'Super Admin dapat reschedule kapan saja tanpa batas H-2; jadwal pengganti tetap harus tersedia dan belum dimulai.';
export function getRescheduleNotice(role?: string) {
  return role === 'SUPER_ADMIN' ? SUPER_ADMIN_RESCHEDULE_NOTICE : RESCHEDULE_NOTICE;
}

export function canRescheduleAt(
  startAt: string | Date | undefined,
  now = Date.now(),
  role?: string
): boolean {
  if (!startAt || !dayjs(startAt).isValid()) return false;
  const start =
    typeof startAt === 'string' && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(startAt)
      ? dayjs.tz(startAt, 'Asia/Jakarta')
      : dayjs(startAt);
  if (!start.isValid()) return false;
  if (role === 'SUPER_ADMIN') return true;
  return start.valueOf() - now >= 48 * 3_600_000;
}
