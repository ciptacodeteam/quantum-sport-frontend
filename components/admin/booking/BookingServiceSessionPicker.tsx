'use client';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { CheckCircle2, ChevronRight, Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceSession } from '@/queries/admin/bookingService';

export function serviceSessionDate(date: string) {
  return dayjs(date).locale('id').format('ddd, D MMM YYYY');
}
export default function BookingServiceSessionPicker({
  sessions,
  value,
  onChange,
  serviceLabel = 'Layanan',
  disabled
}: {
  sessions: (ServiceSession & { id: string; courtName?: string; selected: boolean })[];
  serviceLabel?: string;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  if (sessions.length < 2) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Pilih jam bermain</p>
        <span className="bg-muted rounded-full px-3 py-1 text-xs font-medium">
          {sessions.filter((session) => session.selected).length} dari {sessions.length} jam ·{' '}
          {serviceLabel.toLowerCase()} diterapkan
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        Klik jam untuk mengatur {serviceLabel.toLowerCase()}. Setiap jam diatur terpisah.
      </p>
      <div
        role="group"
        aria-label="Jam layanan"
        className="grid max-w-3xl grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3"
      >
        {sessions.map((session) => {
          const isOpen = value === session.id;
          return (
            <button
              key={session.id}
              type="button"
              disabled={disabled}
              data-admin-slot
              aria-pressed={isOpen}
              onClick={() => onChange(session.id)}
              aria-label={`${session.courtName ? `${session.courtName} · ` : ''}${session.date} · ${session.timeSlot}`}
              className={cn(
                'focus-visible:outline-primary flex min-h-32 flex-col gap-3 rounded-xl border-2 p-4 text-left transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                isOpen
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40'
              )}
            >
              <span className="flex w-full items-center gap-2 text-base font-semibold tabular-nums">
                <Clock3 className="size-4 shrink-0 opacity-75" />
                {session.timeSlot}
              </span>
              <span className="text-muted-foreground text-xs">
                {session.courtName ? `${session.courtName} · ` : ''}
                {dayjs(session.date).locale('id').format('D MMM')}
              </span>
              <span className="mt-auto flex w-full flex-wrap items-center justify-between gap-2 border-t border-current/15 pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  {session.selected && <CheckCircle2 className="size-3.5 shrink-0" />}
                  {session.selected
                    ? `${serviceLabel} diterapkan`
                    : `Belum ada ${serviceLabel.toLowerCase()}`}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  {isOpen ? 'Sedang dibuka' : 'Buka jam ini'}
                  <ChevronRight className="size-3.5" />
                </span>
              </span>
            </button>
          );
        })}
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
