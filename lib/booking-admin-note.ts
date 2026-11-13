import { z } from 'zod';
import { formatBookingDate, formatBookingSlotDate } from './booking-display';

const schedule = z.object({
  court: z.string(),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true })
});
const auditSchema = z.object({
  at: z.string().datetime(),
  actorId: z.string(),
  from: schedule,
  to: schedule
});

export type BookingHistoryEntry = {
  title: string;
  at: string;
  description: string;
  raw: string;
};

/** Keep original notes intact; only recognized audit lines become history. */
export function parseBookingAdminNote(note: string) {
  const notes: string[] = [];
  const history: BookingHistoryEntry[] = [];
  for (const line of note.split('\n')) {
    const marker = line.match(/^\[(COURT_CHANGE|COURT_RESCHEDULE)\] (.+)$/);
    if (marker) {
      try {
        const audit = auditSchema.parse(JSON.parse(marker[2]));
        const changedCourt = marker[1] === 'COURT_CHANGE';
        const date = (value: string) => formatBookingDate(value, 'DD MMM YYYY · HH:mm');
        const end = formatBookingDate(audit.to.endAt, 'HH:mm');
        history.push({
          title: changedCourt ? 'Pindah lapangan' : 'Reschedule lapangan',
          at: audit.at,
          description: changedCourt
            ? `${audit.from.court} → ${audit.to.court}\n${date(audit.to.startAt)}–${end} WIB\nTanggal, jam, dan biaya tetap.`
            : `${audit.from.court} · ${date(audit.from.startAt)} WIB →\n${audit.to.court} · ${date(audit.to.startAt)}–${end} WIB`,
          raw: line
        });
        continue;
      } catch {
        // Malformed or edited audit lines remain available as ordinary notes.
      }
    }
    const legacy = line.match(
      /^\[([^\]]+)\] Admin (\S+) pindah lapangan: (\S+) → (\S+); (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) WIB; tanggal, jam dan biaya tetap\.$/
    );
    if (legacy && Number.isFinite(Date.parse(legacy[1]))) {
      history.push({
        title: 'Pindah lapangan',
        at: legacy[1],
        description: `${formatBookingSlotDate(legacy[5], 'DD MMM YYYY · HH:mm')} WIB\nTanggal, jam, dan biaya tetap.\nNama lapangan tidak tercatat pada riwayat lama.`,
        raw: line
      });
      continue;
    }
    notes.push(line);
  }
  return {
    note: notes.join('\n').trim(),
    history: history.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  };
}
