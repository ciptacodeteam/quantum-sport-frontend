'use client';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Check, Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceSession } from '@/queries/admin/bookingService';

export function serviceSessionDate(date: string) {
  return dayjs(date).locale('id').format('ddd, D MMM YYYY');
}
export default function BookingServiceSessionPicker({
  sessions,
  value,
  onChange,
  disabled
}: {
  sessions: (ServiceSession & { id: string; courtName?: string; selected: boolean })[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  if (sessions.length < 2) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground font-medium">Pilih jam bermain</span>
        <span className="text-muted-foreground">
          {sessions.filter((session) => session.selected).length}/{sessions.length} jam dipilih
        </span>
      </div>
      <div role="group" aria-label="Jam layanan" className="flex gap-1.5 overflow-x-auto p-1">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            disabled={disabled}
            aria-pressed={value === session.id}
            onClick={() => onChange(session.id)}
            aria-label={`${session.courtName ? `${session.courtName} · ` : ''}${session.date} · ${session.timeSlot}`}
            className={cn(
              'flex min-w-40 shrink-0 items-start gap-3 rounded-md border-0 px-3 py-2.5 text-left shadow-none transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50',
              value === session.id
                ? 'bg-primary/10 text-primary'
                : 'bg-muted/30 hover:bg-muted/60'
            )}
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                <Clock3 className="text-muted-foreground size-3.5" />
                {session.timeSlot}
              </span>
              <span className="text-muted-foreground mt-1 block text-xs">
                {session.courtName ? `${session.courtName} · ` : ''}
                {dayjs(session.date).locale('id').format('D MMM')}
              </span>
            </span>
            {session.selected && (
              <Check className="text-primary mt-0.5 size-4 shrink-0" aria-label="Layanan dipilih" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BookingServiceLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3 py-2">
      <p className="text-muted-foreground text-sm">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((key) => (
          <div key={key} className="bg-muted/40 h-20 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}
