import dayjs from '@/lib/dayjs';
import { parseScheduleDatetime } from './admin-schedule-time';
import { isCourtWallSlotBookable } from './booking-time-policy';

export const RESCHEDULE_NOTICE = 'Reschedule maksimal H-2 (minimal 48 jam sebelum jadwal asal).';

export const SUPER_ADMIN_RESCHEDULE_NOTICE =
  'Super Admin dapat reschedule hingga sebelum 30 menit setelah jadwal asal dimulai; jadwal pengganti tetap harus tersedia dan belum dimulai.';
export function getRescheduleNotice(role?: string) {
  return role === 'SUPER_ADMIN' ? SUPER_ADMIN_RESCHEDULE_NOTICE : RESCHEDULE_NOTICE;
}

export function canRescheduleAt(
  startAt: string | Date | undefined,
  now = Date.now(),
  role?: string
): boolean {
  if (!startAt || !dayjs(startAt).isValid()) return false;
  if (role === 'SUPER_ADMIN') return isCourtWallSlotBookable(startAt, now);
  const start = parseScheduleDatetime(startAt);
  if (!start.isValid()) return false;
  return start.valueOf() - now >= 48 * 3_600_000;
}
