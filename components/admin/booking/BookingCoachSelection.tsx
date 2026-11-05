'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import { useBranchStore } from '@/stores/useBranchStore';
import type { SelectedCoach } from '@/stores/useBookingStore';
import type { CoachAvailability } from '@/types/model';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type Session = { date: string; timeSlot: string; startAt?: string; endAt?: string };
export const coachSessionKey = (session: Session) => `${session.date}|${session.timeSlot}`;

export default function BookingCoachSelection({
  sessions,
  sport,
  selected,
  onSelect,
  disabled
}: {
  sessions: Session[];
  sport: 'PADEL' | 'TENNIS';
  selected: SelectedCoach[];
  onSelect: (session: Session, coach: SelectedCoach | null) => void;
  disabled?: boolean;
}) {
  const unique = [
    ...new Map(sessions.map((session) => [coachSessionKey(session), session])).values()
  ];
  return (
    <section aria-label="Pilihan coach" className="space-y-3 rounded-xl border p-4">
      <div>
        <h3 className="text-sm font-semibold">Pilih coach (opsional)</h3>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Pilih coach sesuai jam bermain, atau lanjutkan konfirmasi tanpa coach.
        </p>
      </div>
      {unique.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Tambahkan lapangan dan jam bermain terlebih dahulu.
        </p>
      ) : (
        unique.map((session) => (
          <CoachSession
            key={`${sport}|${coachSessionKey(session)}`}
            session={session}
            sport={sport}
            selected={selected.find((coach) => coachSessionKey(coach) === coachSessionKey(session))}
            onSelect={(coach) => onSelect(session, coach)}
            disabled={disabled}
          />
        ))
      )}
    </section>
  );
}

function CoachSession({
  session,
  sport,
  selected,
  onSelect,
  disabled
}: {
  session: Session;
  sport: 'PADEL' | 'TENNIS';
  selected?: SelectedCoach;
  onSelect: (coach: SelectedCoach | null) => void;
  disabled?: boolean;
}) {
  const branchId = useBranchStore((state) => state.branch?.id);
  const [start, end] = session.timeSlot.split(' - ');
  const startAt = session.startAt ?? `${session.date}T${start}:00`;
  const endAt = session.endAt ?? `${session.date}T${end}:00`;
  const {
    data = [],
    isPending,
    isError,
    refetch
  } = useQuery({
    queryKey: ['admin', 'booking-coaches', branchId, startAt, endAt, sport],
    queryFn: async () =>
      (
        await adminApi.get('/coach/availability', {
          params: { startAt, endAt, courtSport: sport }
        })
      ).data.data as CoachAvailability[]
  });
  // Availability returns overlapping slots; offer only the exact court session.
  const options = data.filter(
    (option) =>
      option.startAt.slice(0, 16).replace(' ', 'T') === startAt.slice(0, 16).replace(' ', 'T') &&
      option.endAt.slice(0, 16).replace(' ', 'T') === endAt.slice(0, 16).replace(' ', 'T')
  );
  const unavailable =
    selected && !isPending && !options.some((option) => option.slotId === selected.slotId);
  const label = `${session.date} · ${session.timeSlot}`;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">{label}</p>
      <Select
        value={selected?.slotId ?? 'none'}
        disabled={disabled}
        onValueChange={(value) => {
          const option = options.find((item) => item.slotId === value);
          onSelect(
            option
              ? {
                  coachId: option.coach.id,
                  coachName: option.coach.name,
                  slotId: option.slotId,
                  date: session.date,
                  timeSlot: session.timeSlot,
                  price: option.price,
                  startAt: option.startAt,
                  endAt: option.endAt,
                  courtSport: sport
                }
              : null
          );
        }}
      >
        <SelectTrigger
          aria-label={`Coach ${label}`}
          className="h-auto min-h-11 w-full text-left whitespace-normal"
        >
          <SelectValue placeholder="Tanpa coach">
            {selected
              ? `${selected.coachName} · Rp ${selected.price.toLocaleString('id-ID')}`
              : 'Tanpa coach'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Tanpa coach</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.slotId} value={option.slotId}>
              {option.coach.name} · Rp {option.price.toLocaleString('id-ID')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <p className="text-muted-foreground text-xs">Memuat coach tersedia...</p>}
      {isError ? (
        <p className="text-destructive text-xs">
          Gagal memuat coach.{' '}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Coba lagi
          </button>{' '}
          atau pilih tanpa coach.
        </p>
      ) : unavailable ? (
        <p role="alert" className="text-destructive text-xs">
          Coach sudah tidak tersedia. Pilih ulang atau lanjutkan tanpa coach.
        </p>
      ) : (
        !isPending &&
        options.length === 0 && (
          <p className="text-muted-foreground text-xs">
            Tidak ada coach tersedia pada jam ini. Booking dapat dilanjutkan tanpa coach.
          </p>
        )
      )}
    </div>
  );
}
