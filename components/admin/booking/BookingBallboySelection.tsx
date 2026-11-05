'use client';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { coachingApi, type CoachingPerson } from '@/api/admin/coaching';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { adminApi } from '@/lib/adminApi';
import { serviceMatchesSport } from '@/lib/service-sport';
import type { BookingItem, SelectedBallboy } from '@/stores/useBookingStore';
import type { BallboyAvailability } from '@/types/model';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BookingBallboySelection({
  sessions,
  sport,
  selected,
  onSelect,
  disabled
}: {
  sessions: BookingItem[];
  sport: 'PADEL' | 'TENNIS';
  selected: SelectedBallboy[];
  onSelect: (session: BookingItem, ballboy: SelectedBallboy | null) => void;
  disabled?: boolean;
}) {
  const { branchId } = useAdminCourtSports();
  const people = useQuery({
    queryKey: ['admin', 'coaching', branchId, 'booking-catalog'],
    queryFn: coachingApi.list,
    enabled: !!branchId
  });
  const ballboys = (people.data ?? []).filter(
    (person) => person.role === 'BALLBOY' && serviceMatchesSport('BALLBOY', person.coachType, sport)
  );
  return (
    <section aria-label="Pilihan ballboy" className="space-y-4 rounded-xl border p-4 sm:p-5">
      <div>
        <h3 className="font-semibold">Pilih ballboy (opsional)</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Pilih ballboy sesuai olahraga, lapangan, dan jam bermain. Ballboy yang tidak tersedia
          tidak dapat dipilih.
        </p>
      </div>
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
        <p>Memuat ballboy...</p>
      ) : (
        sessions.map((session) => (
          <BallboySession
            key={session.slotId}
            session={session}
            sport={sport}
            branchId={branchId}
            people={ballboys}
            selected={selected}
            onSelect={(ballboy) => onSelect(session, ballboy)}
            disabled={disabled}
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
  disabled
}: {
  session: BookingItem;
  sport: 'PADEL' | 'TENNIS';
  branchId: string;
  people: CoachingPerson[];
  selected: SelectedBallboy[];
  onSelect: (ballboy: SelectedBallboy | null) => void;
  disabled?: boolean;
}) {
  const [start, end] = session.timeSlot.split(' - ');
  const startAt = session.startAt ?? `${session.date}T${start}:00`;
  const endDate =
    end <= start ? dayjs(session.date).add(1, 'day').format('YYYY-MM-DD') : session.date;
  const endAt = session.endAt ?? `${endDate}T${end}:00`;
  const availability = useQuery({
    queryKey: ['admin', 'booking-ballboys', branchId, startAt, endAt, sport],
    queryFn: async () =>
      (
        await adminApi.get('/ballboy/availability', {
          params: { startAt, endAt, courtSport: sport }
        })
      ).data.data as BallboyAvailability[],
    refetchInterval: 10000
  });
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
    <div className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {session.courtName} · {session.date} · {session.timeSlot}
        </p>
        <Button
          type="button"
          size="sm"
          variant={current ? 'outline' : 'default'}
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
              className="aria-pressed:border-primary flex min-h-20 items-center justify-between gap-3 rounded-lg border p-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
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
              <Badge variant={option ? 'lightSuccess' : 'lightNeutral'}>
                {!person.isActive ? 'Nonaktif' : option ? 'Tersedia' : 'Tidak tersedia'}
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
