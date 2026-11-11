'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { serviceMatchesSport } from '@/lib/service-sport';
import { useQuery } from '@tanstack/react-query';
import { coachingApi, type CoachingPerson } from '@/api/admin/coaching';
import { coachingGroupApi, type CoachingGroup } from '@/api/admin/coachingGroup';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SelectedCoach } from '@/stores/useBookingStore';
import type { CoachAvailability } from '@/types/model';

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
  const { branchId } = useAdminCourtSports();
  const people = useQuery({
    queryKey: ['admin', 'coaching', branchId, 'booking-catalog'],
    queryFn: coachingApi.list,
    enabled: !!branchId
  });
  const groups = useQuery({
    queryKey: ['admin', 'coaching-groups', branchId],
    queryFn: () => coachingGroupApi.list(branchId),
    enabled: !!branchId
  });
  const unique = [
    ...new Map(sessions.map((session) => [coachSessionKey(session), session])).values()
  ];
  const coaches = (people.data ?? []).filter(
    (person) =>
      person.role === 'COACH' &&
      !person.isInHouseCoach &&
      !person.inHousePlans?.length &&
      serviceMatchesSport('COACH', person.coachType, sport)
  );
  const eligibleGroups = (groups.data ?? []).filter(
    (group) =>
      group.isActive &&
      group.sports.includes(sport) &&
      group.branches.some((branch) => branch.branchId === branchId)
  );
  const independent = coaches.filter(
    (coach) =>
      !coach.coachingGroups?.length &&
      !(groups.data ?? []).some((group) =>
        group.coaches.some((member) => member.staffId === coach.id)
      )
  );
  return (
    <section aria-label="Pilihan coach" className="space-y-5 rounded-xl border p-4 sm:p-5">
      <div>
        <h3 className="font-semibold">Pilih coach (opsional)</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Pilih beberapa coach untuk jam yang sama. Klik coach terpilih untuk membatalkan pilihan.
          Coach yang tidak tersedia tetap ditampilkan dan tidak dapat dipilih.
        </p>
      </div>
      {!branchId ? (
        <p className="text-muted-foreground text-sm">Pilih satu cabang terlebih dahulu.</p>
      ) : people.isError || groups.isError ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>Daftar grup dan coach belum dapat dimuat.</p>
          <Button
            variant="outline"
            onClick={() => {
              void people.refetch();
              void groups.refetch();
            }}
          >
            Coba lagi
          </Button>
        </div>
      ) : people.isPending || groups.isPending ? (
        <p className="text-muted-foreground text-sm">Memuat grup dan coach...</p>
      ) : unique.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Tambahkan lapangan dan jam bermain terlebih dahulu.
        </p>
      ) : (
        unique.map((session) => (
          <CoachSession
            key={`${sport}|${coachSessionKey(session)}`}
            branchId={branchId}
            session={session}
            sport={sport}
            groups={eligibleGroups}
            coaches={coaches}
            independent={independent}
            selected={selected.filter(
              (coach) => coachSessionKey(coach) === coachSessionKey(session)
            )}
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
  branchId,
  groups,
  coaches,
  independent,
  selected,
  onSelect,
  disabled
}: {
  session: Session;
  sport: 'PADEL' | 'TENNIS';
  branchId: string;
  groups: CoachingGroup[];
  coaches: CoachingPerson[];
  independent: CoachingPerson[];
  selected: SelectedCoach[];
  onSelect: (coach: SelectedCoach | null) => void;
  disabled?: boolean;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(
    selected[0]?.coachingGroupId ?? (selected.length ? 'independent' : null)
  );
  const [start, end] = session.timeSlot.split(' - ');
  const startAt = session.startAt ?? `${session.date}T${start}:00`;
  const endDate =
    end <= start ? dayjs(session.date).add(1, 'day').format('YYYY-MM-DD') : session.date;
  const endAt = session.endAt ?? `${endDate}T${end}:00`;
  const availability = useQuery({
    queryKey: ['admin', 'booking-coaches', branchId, startAt, endAt, sport],
    queryFn: async () =>
      (await adminApi.get('/coach/availability', { params: { startAt, endAt, courtSport: sport } }))
        .data.data as CoachAvailability[],
    refetchInterval: 10000
  });
  const wall = (value: string) => value.slice(0, 16).replace(' ', 'T');
  const options = (availability.data ?? []).filter(
    (option) => wall(option.startAt) === wall(startAt) && wall(option.endAt) === wall(endAt)
  );
  const optionFor = (coach: CoachingPerson) =>
    coach.isActive && !availability.isError && !availability.isPending
      ? options.find((option) => option.coach.id === coach.id)
      : undefined;
  const entries = groups.map((group) => ({
    id: group.id,
    name: group.name,
    members: coaches.filter((coach) => group.coaches.some((member) => member.staffId === coach.id))
  }));
  if (independent.length)
    entries.push({ id: 'independent', name: 'Coach Independen', members: independent });
  const unavailable =
    !availability.isPending &&
    selected.some(
      (selection) =>
        !options.some((option) => option.slotId === selection.slotId) ||
        !(selection.coachingGroupId
          ? entries.some(
              (group) =>
                group.id === selection.coachingGroupId &&
                group.members.some((coach) => coach.id === selection.coachId)
            )
          : independent.some((coach) => coach.id === selection.coachId)) ||
        !coaches.some((coach) => coach.id === selection.coachId && coach.isActive)
    );
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {session.date} · {session.timeSlot}
        </p>
        <Button
          type="button"
          variant={!selected.length ? 'default' : 'outline'}
          size="sm"
          aria-pressed={!selected.length}
          disabled={disabled}
          onClick={() => onSelect(null)}
        >
          Tanpa coach
        </Button>
      </div>
      {selected.length > 0 && (
        <p className="text-primary text-xs">
          Terpilih ({selected.length}):{' '}
          {selected
            .map((coach) =>
              coach.coachingGroupName
                ? `${coach.coachName} · ${coach.coachingGroupName}`
                : coach.coachName
            )
            .join('; ')}
        </p>
      )}
      {entries.map((group) => {
        const expanded = openGroup === group.id;
        const availableCount = group.members.filter((coach) => optionFor(coach)).length;
        return (
          <div key={group.id} className="overflow-hidden rounded-xl border">
            <button
              type="button"
              disabled={disabled}
              aria-expanded={expanded}
              onClick={() => setOpenGroup(expanded ? null : group.id)}
              className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 p-4 text-left disabled:opacity-50"
            >
              <span className="text-sm font-medium">{group.name}</span>
              <span className="text-muted-foreground text-xs">
                {availability.isPending
                  ? 'Memuat...'
                  : `${availableCount}/${group.members.length} tersedia`}{' '}
                · {expanded ? 'Tutup' : 'Lihat coach'}
              </span>
            </button>
            {expanded && (
              <div
                role="group"
                aria-label={`Coach ${group.name}`}
                className="bg-muted/20 grid gap-2 border-t p-3 sm:grid-cols-2"
              >
                {group.members.length === 0 && (
                  <p className="text-muted-foreground p-2 text-xs">
                    Belum ada coach dalam grup ini.
                  </p>
                )}
                {group.members.map((coach) => {
                  const option = optionFor(coach);
                  const chosen = selected.some(
                    (selection) =>
                      selection.coachId === coach.id &&
                      (selection.coachingGroupId ?? 'independent') === group.id
                  );
                  const chosenCoach = selected.find((selection) => selection.coachId === coach.id);
                  return (
                    <button
                      key={coach.id}
                      type="button"
                      disabled={disabled || (!option && !chosen)}
                      aria-pressed={chosen}
                      aria-label={`Pilih ${coach.name}`}
                      className={`bg-background flex min-h-20 items-center justify-between gap-3 rounded-lg border p-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${chosen ? 'border-primary ring-primary/20 ring-2' : ''}`}
                      onClick={() => {
                        if (chosen && chosenCoach) {
                          onSelect(chosenCoach);
                          return;
                        }
                        if (!option) return;
                        onSelect({
                          coachId: coach.id,
                          coachName: coach.name,
                          slotId: option.slotId,
                          date: session.date,
                          timeSlot: session.timeSlot,
                          price: option.price,
                          additionalHourPrice: option.additionalHourPrice,
                          startAt: option.startAt,
                          endAt: option.endAt,
                          courtSport: sport,
                          ...(group.id !== 'independent'
                            ? { coachingGroupId: group.id, coachingGroupName: group.name }
                            : {})
                        });
                      }}
                    >
                      <span className="min-w-0 space-y-1">
                        <span className="block text-sm font-medium">{coach.name}</span>
                        {option && (
                          <span className="text-muted-foreground block text-xs">
                            Rp {option.price.toLocaleString('id-ID')}
                            {option.additionalHourPrice != null && (
                              <span className="block text-xs">
                                Jam berikutnya Rp{' '}
                                {option.additionalHourPrice.toLocaleString('id-ID')}/jam
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                      <Badge variant={option ? 'lightSuccess' : 'lightNeutral'}>
                        {!coach.isActive
                          ? 'Nonaktif'
                          : option
                            ? chosen
                              ? 'Dipilih'
                              : 'Tersedia'
                            : 'Tidak tersedia'}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {!entries.length && (
        <p className="text-muted-foreground text-sm">
          Belum ada grup atau coach untuk olahraga ini.
        </p>
      )}
      {availability.isError && (
        <p role="alert" className="text-destructive text-xs">
          Ketersediaan coach gagal dimuat.{' '}
          <button type="button" className="underline" onClick={() => void availability.refetch()}>
            Coba lagi
          </button>{' '}
          atau lanjutkan tanpa coach.
        </p>
      )}
      {unavailable && (
        <p role="alert" className="text-destructive text-xs">
          Coach atau grup terpilih sudah tidak tersedia. Pilih ulang atau lanjutkan tanpa coach.
        </p>
      )}
    </div>
  );
}
