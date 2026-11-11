'use client';
import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import BookingServiceSessionPicker, {
  BookingServiceLoading,
  serviceSessionDate
} from './BookingServiceSessionPicker';
import { ballboyAvailabilityOptions, serviceSessionRange } from '@/queries/admin/bookingService';
import { coachingApi, type CoachingPerson } from '@/api/admin/coaching';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { serviceMatchesSport } from '@/lib/service-sport';
import type { BookingItem, SelectedBallboy } from '@/stores/useBookingStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BookingBallboySelection({
  sessions,
  sport,
  selected,
  onSelect,
  disabled,
  active = true,
  embedded = false
}: {
  sessions: BookingItem[];
  sport: 'PADEL' | 'TENNIS';
  selected: SelectedBallboy[];
  onSelect: (session: BookingItem, ballboy: SelectedBallboy | null) => void;
  disabled?: boolean;
  active?: boolean;
  embedded?: boolean;
}) {
  const { branchId } = useAdminCourtSports();
  const people = useQuery({
    queryKey: ['admin', 'coaching', branchId, 'booking-catalog'],
    queryFn: coachingApi.list,
    staleTime: 60000,
    retry: 1,
    enabled: !!branchId && branchId !== 'all' && (active || selected.length > 0)
  });
  const [sessionId, setSessionId] = useState('');
  const currentSession = sessions.find((session) => session.slotId === sessionId) ?? sessions[0];
  const ranges = [
    ...new Map(sessions.map((session) => [`${session.date}|${session.timeSlot}`, session])).values()
  ];
  useQueries({
    queries: ranges.map((session) =>
      ballboyAvailabilityOptions(branchId, session, sport, active || selected.length > 0)
    )
  });
  const ballboys = (people.data ?? []).filter(
    (person) => person.role === 'BALLBOY' && serviceMatchesSport('BALLBOY', person.coachType, sport)
  );
  return (
    <section
      aria-label="Pilihan ballboy"
      className={embedded ? 'space-y-4' : 'space-y-4 rounded-md p-4 sm:p-5'}
    >
      <div>
        <h3 className="font-semibold">Ballboy</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Pilih satu ballboy untuk setiap lapangan dan jam bermain. Harga ditampilkan per jam.
        </p>
      </div>
      <BookingServiceSessionPicker
        value={currentSession?.slotId ?? ''}
        onChange={setSessionId}
        disabled={disabled}
        sessions={sessions.map((session) => ({
          ...session,
          id: session.slotId,
          selected: selected.some((ballboy) => ballboy.courtSlotId === session.slotId)
        }))}
      />
      {!branchId ? (
        <p className="text-sm">Pilih satu cabang terlebih dahulu.</p>
      ) : people.isError ? (
        <p role="alert">
          Daftar ballboy gagal dimuat.{' '}
          <button type="button" className="underline" onClick={() => void people.refetch()}>
            Coba lagi
          </button>
        </p>
      ) : people.isPending ? (
        <BookingServiceLoading label="Memuat ballboy..." />
      ) : (
        (currentSession ? [currentSession] : []).map((session) => (
          <BallboySession
            key={session.slotId}
            session={session}
            sport={sport}
            branchId={branchId}
            people={ballboys}
            selected={selected}
            onSelect={(ballboy) => onSelect(session, ballboy)}
            disabled={disabled}
            active={active || selected.length > 0}
          />
        ))
      )}
    </section>
  );
}
function BallboySession({
  session,
  sport,
  branchId,
  people,
  selected,
  onSelect,
  disabled,
  active
}: {
  session: BookingItem;
  sport: 'PADEL' | 'TENNIS';
  branchId: string;
  people: CoachingPerson[];
  selected: SelectedBallboy[];
  onSelect: (ballboy: SelectedBallboy | null) => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const { startAt, endAt } = serviceSessionRange(session);
  const availability = useQuery(ballboyAvailabilityOptions(branchId, session, sport, active));
  const wall = (value: string) => value.slice(0, 16).replace(' ', 'T');
  const options = (availability.data ?? []).filter(
    (option) => wall(option.startAt) === wall(startAt) && wall(option.endAt) === wall(endAt)
  );
  const current = selected.find((item) => item.courtSlotId === session.slotId);
  const optionFor = (person: CoachingPerson) =>
    person.isActive && !availability.isError && !availability.isPending
      ? options.find(
          (option) =>
            option.ballboy.id === person.id &&
            !selected.some(
              (item) =>
                item.ballboyId === person.id &&
                item.courtSlotId !== session.slotId &&
                wall(item.startAt ?? '') < wall(endAt) &&
                wall(item.endAt ?? '') > wall(startAt)
            )
        )
      : undefined;
  return (
    <div className="space-y-3 rounded-md p-1 sm:p-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {session.courtName} · {serviceSessionDate(session.date)} · {session.timeSlot}
        </p>
        <Button
          type="button"
          size="sm"
          className="rounded-md border-0 shadow-none"
          variant={current ? 'outline' : 'secondary'}
          disabled={disabled}
          onClick={() => onSelect(null)}
        >
          Tanpa ballboy
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {people.map((person) => {
          const option = optionFor(person);
          return (
            <button
              type="button"
              key={person.id}
              aria-label={`Pilih ballboy ${person.name} untuk ${session.courtName} ${session.timeSlot}`}
              disabled={disabled || !option}
              aria-pressed={current?.ballboyId === person.id}
              className="bg-muted/30 hover:bg-muted/60 aria-pressed:bg-primary/10 aria-pressed:text-primary focus-visible:outline-primary flex min-h-18 items-center justify-between gap-3 rounded-md border-0 p-3 text-left shadow-none transition-colors outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (option)
                  onSelect({
                    ballboyId: person.id,
                    ballboyName: person.name,
                    slotId: option.slotId,
                    price: option.price,
                    date: session.date,
                    timeSlot: session.timeSlot,
                    startAt: option.startAt,
                    endAt: option.endAt,
                    courtId: session.courtId,
                    courtName: session.courtName,
                    courtSlotId: session.slotId,
                    courtSport: sport
                  });
              }}
            >
              <span>
                <span className="block text-sm font-medium">{person.name}</span>
                {option && (
                  <span className="text-muted-foreground text-xs">
                    Rp {option.price.toLocaleString('id-ID')}
                  </span>
                )}
              </span>
              <Badge
                className="rounded-sm border-0"
                variant={option ? 'lightSuccess' : 'lightNeutral'}
              >
                {!person.isActive
                  ? 'Nonaktif'
                  : current?.ballboyId === person.id
                    ? 'Dipilih'
                    : option
                      ? 'Tersedia'
                      : 'Tidak tersedia'}
              </Badge>
            </button>
          );
        })}
      </div>
      {!people.length && (
        <p className="text-muted-foreground text-sm">Belum ada ballboy untuk olahraga ini.</p>
      )}
      {availability.isError && (
        <p role="alert" className="text-destructive text-xs">
          Ketersediaan ballboy gagal dimuat.{' '}
          <button type="button" className="underline" onClick={() => void availability.refetch()}>
            Coba lagi
          </button>{' '}
          atau lanjut tanpa ballboy.
        </p>
      )}
      {current &&
        !availability.isPending &&
        !people.some(
          (person) =>
            person.id === current.ballboyId && optionFor(person)?.slotId === current.slotId
        ) && (
          <p role="alert" className="text-destructive text-xs">
            Ballboy terpilih tidak tersedia. Pilih ulang atau lanjut tanpa ballboy.
          </p>
        )}
    </div>
  );
}
