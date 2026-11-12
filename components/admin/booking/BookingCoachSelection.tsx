'use client';

import { useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import BookingServiceSessionPicker, {
  BookingServiceLoading,
  serviceSessionDate
} from './BookingServiceSessionPicker';
import { coachAvailabilityOptions, serviceSessionRange } from '@/queries/admin/bookingService';
import { serviceMatchesSport } from '@/lib/service-sport';
import { useQuery, useQueries } from '@tanstack/react-query';
import { coachingApi, type CoachingPerson } from '@/api/admin/coaching';
import { coachingGroupApi, type CoachingGroup } from '@/api/admin/coachingGroup';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SelectedCoach } from '@/stores/useBookingStore';

type Session = { date: string; timeSlot: string; startAt?: string; endAt?: string };
export const coachSessionKey = (session: Session) => `${session.date}|${session.timeSlot}`;

export default function BookingCoachSelection({
  sessions,
  sport,
  selected,
  onSelect,
  onParticipantsChange,
  disabled,
  active = true,
  embedded = false
}: {
  sessions: Session[];
  sport: 'PADEL' | 'TENNIS';
  selected: SelectedCoach[];
  onSelect: (session: Session, coach: SelectedCoach | null) => void;
  onParticipantsChange?: (slotId: string, participants: number) => void;
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
  const groups = useQuery({
    queryKey: ['admin', 'coaching-groups', branchId],
    queryFn: () => coachingGroupApi.list(branchId),
    staleTime: 60000,
    retry: 1,
    enabled: !!branchId && branchId !== 'all' && (active || selected.length > 0)
  });
  const unique = [
    ...new Map(sessions.map((session) => [coachSessionKey(session), session])).values()
  ];
  const [sessionId, setSessionId] = useState('');
  const currentSession =
    unique.find((session) => coachSessionKey(session) === sessionId) ?? unique[0];
  useQueries({
    queries: unique.map((session) =>
      coachAvailabilityOptions(branchId, session, sport, active || selected.length > 0)
    )
  });
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
    <section
      aria-label="Pilihan coach"
      className={embedded ? 'space-y-4' : 'space-y-4 rounded-md p-4 sm:p-5'}
    >
      <div>
        <h3 className="font-semibold">Coach Club</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Pilih jam bermain, lalu grup dan coach. Beberapa coach dapat dipilih untuk jam yang sama.
        </p>
      </div>
      <BookingServiceSessionPicker
        serviceLabel="Coach"
        value={currentSession ? coachSessionKey(currentSession) : ''}
        onChange={setSessionId}
        disabled={disabled}
        sessions={unique.map((session) => ({
          ...session,
          id: coachSessionKey(session),
          selected: selected.some((coach) => coachSessionKey(coach) === coachSessionKey(session))
        }))}
      />
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
        <BookingServiceLoading label="Memuat grup dan coach..." />
      ) : unique.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Tambahkan lapangan dan jam bermain terlebih dahulu.
        </p>
      ) : (
        (currentSession ? [currentSession] : []).map((session) => (
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
            onParticipantsChange={onParticipantsChange}
            disabled={disabled}
            active={active || selected.length > 0}
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
  onParticipantsChange,
  disabled,
  active
}: {
  session: Session;
  sport: 'PADEL' | 'TENNIS';
  branchId: string;
  groups: CoachingGroup[];
  coaches: CoachingPerson[];
  independent: CoachingPerson[];
  selected: SelectedCoach[];
  onSelect: (coach: SelectedCoach | null) => void;
  onParticipantsChange?: (slotId: string, participants: number) => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(
    selected[0]?.coachingGroupId ?? (selected.length ? 'independent' : null)
  );
  const { startAt, endAt } = serviceSessionRange(session);
  const availability = useQuery(coachAvailabilityOptions(branchId, session, sport, active));
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
    <div className="space-y-3 rounded-md p-1 sm:p-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {serviceSessionDate(session.date)} · {session.timeSlot}
        </p>
        <Button
          type="button"
          variant={!selected.length ? 'secondary' : 'outline'}
          size="sm"
          className="rounded-md border-0 shadow-none"
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
      {selected
        .filter((coach) => coach.coachingGroupId)
        .map((coach) => (
          <div key={coach.slotId} className="bg-muted/20 space-y-2 rounded-md p-3">
            <Label htmlFor={`club-participants-${coach.slotId}`}>
              Jumlah member · {coach.coachName} · {coach.coachingGroupName}
            </Label>
            <Input
              id={`club-participants-${coach.slotId}`}
              type="number"
              min={1}
              max={100}
              step={1}
              value={coach.participants ?? 1}
              disabled={disabled || !onParticipantsChange}
              onChange={(event) => {
                const count = Number(event.target.value);
                if (coach.slotId && Number.isInteger(count) && count >= 1 && count <= 100)
                  onParticipantsChange?.(coach.slotId, count);
              }}
            />
            <p className="text-muted-foreground text-xs">
              1–100 member per sesi. Tarif mengikuti harga coach yang dipilih.
            </p>
          </div>
        ))}
      {entries.map((group) => {
        const expanded = openGroup === group.id;
        const availableCount = group.members.filter((coach) => optionFor(coach)).length;
        return (
          <div key={group.id} data-admin-card className="bg-muted/20 overflow-hidden rounded-md">
            <button
              type="button"
              disabled={disabled}
              aria-expanded={expanded}
              onClick={() => setOpenGroup(expanded ? null : group.id)}
              className="hover:bg-muted/50 focus-visible:outline-primary flex w-full items-center justify-between gap-3 rounded-md border-0 px-3.5 py-3 text-left shadow-none outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:opacity-50"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Users className="text-muted-foreground size-4 shrink-0" />
                {group.name}
              </span>
              <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
                {availability.isPending
                  ? 'Memuat...'
                  : `${availableCount}/${group.members.length} tersedia`}{' '}
                <ChevronDown
                  className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </span>
            </button>
            {expanded && (
              <div
                role="group"
                aria-label={`Coach ${group.name}`}
                className="grid gap-2 p-2 pt-0 sm:grid-cols-2"
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
                      data-admin-card
                      type="button"
                      disabled={disabled || (!option && !chosen)}
                      aria-pressed={chosen}
                      aria-label={`Pilih ${coach.name}`}
                      className={`focus-visible:outline-primary flex min-h-18 items-center justify-between gap-3 rounded-md border-0 p-3 text-left shadow-none transition-colors outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${chosen ? 'bg-primary/10 text-primary' : 'bg-background/70 hover:bg-muted/60'}`}
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
                            ? {
                                coachingGroupId: group.id,
                                coachingGroupName: group.name,
                                participants: 1
                              }
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
                      <Badge
                        className="rounded-sm border-0"
                        variant={option ? 'lightSuccess' : 'lightNeutral'}
                      >
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
