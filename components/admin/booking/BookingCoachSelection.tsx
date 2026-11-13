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
import { Switch } from '@/components/ui/switch';
import { useHasRole } from '@/hooks/useRoleAccess';
import { Badge } from '@/components/ui/badge';
import ParticipantCountInput from './ParticipantCountInput';
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
  onSettlementChange,
  disabled,
  active = true,
  embedded = false
}: {
  sessions: Session[];
  sport: 'PADEL' | 'TENNIS';
  selected: SelectedCoach[];
  onSelect: (session: Session, coach: SelectedCoach | null) => void;
  onParticipantsChange?: (slotId: string, participants: number) => void;
  onSettlementChange?: (slotId: string, isSettled: boolean) => void;
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
            onSettlementChange={onSettlementChange}
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
  onSettlementChange,
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
  onSettlementChange?: (slotId: string, isSettled: boolean) => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const canSettle = useHasRole(['ADMIN', 'CASHIER']);
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
                className="grid items-start gap-3 p-3 pt-0 sm:grid-cols-2"
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
                    <div
                      key={coach.id}
                      data-admin-card
                      className={`overflow-hidden rounded-lg border ${chosen ? 'border-primary/40 bg-primary/5' : 'border-border/70 bg-background'}`}
                    >
                      <button
                        type="button"
                        disabled={disabled || (!option && !chosen)}
                        aria-pressed={chosen}
                        aria-label={`Pilih ${coach.name}`}
                        className={`focus-visible:outline-primary flex min-h-18 items-center justify-between gap-3 rounded-md border-0 p-3 text-left shadow-none transition-colors outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${chosen ? 'text-primary hover:bg-primary/5' : 'hover:bg-muted/60'} w-full`}
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
                              {chosen && chosenCoach?.isClubSettled
                                ? 'Lunas · Rp 0'
                                : `Rp ${option.price.toLocaleString('id-ID')}`}
                              {!chosenCoach?.isClubSettled &&
                                option.additionalHourPrice != null && (
                                  <span className="block text-xs">
                                    {group.id !== 'independent'
                                      ? 'Member tambahan Rp '
                                      : 'Jam berikutnya Rp '}
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
                      {chosen && chosenCoach && onSettlementChange && canSettle && (
                        <div className="border-primary/10 flex items-center justify-between gap-3 border-t px-3 py-3">
                          <Label htmlFor={`settled-${chosenCoach.slotId}`} className="text-xs">
                            {chosenCoach.isClubSettled ? 'Lunas ke Club' : 'Belum lunas ke Club'}
                          </Label>
                          <Switch
                            id={`settled-${chosenCoach.slotId}`}
                            aria-label={`Lunas ke Club · ${coach.name}`}
                            checked={chosenCoach.isClubSettled === true}
                            disabled={disabled}
                            onCheckedChange={(checked) => {
                              if (chosenCoach.slotId)
                                onSettlementChange(chosenCoach.slotId, checked);
                            }}
                          />
                        </div>
                      )}
                      {chosen && chosenCoach?.coachingGroupId && (
                        <ClubMemberCount
                          coach={chosenCoach}
                          disabled={disabled || !onParticipantsChange}
                          onChange={(count) => {
                            if (chosenCoach.slotId)
                              onParticipantsChange?.(chosenCoach.slotId, count);
                          }}
                        />
                      )}
                    </div>
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

function ClubMemberCount({
  coach,
  disabled,
  onChange
}: {
  coach: SelectedCoach;
  disabled?: boolean;
  onChange: (count: number) => void;
}) {
  const count = coach.participants ?? 1;
  const id = `club-participants-${coach.slotId}`;
  return (
    <div className="border-primary/10 space-y-2 border-t px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
          <Users className="text-muted-foreground size-4" aria-hidden="true" />
          Jumlah member
          <span className="sr-only">
            {' '}
            · {coach.coachName} · {coach.coachingGroupName}
          </span>
        </Label>
        <ParticipantCountInput
          id={id}
          value={count}
          disabled={disabled}
          onChange={onChange}
          decrementLabel={`Kurangi member ${coach.coachName}`}
          incrementLabel={`Tambah member ${coach.coachName}`}
          describedBy={`${id}-hint`}
        />
      </div>
      <p id={`${id}-hint`} className="text-muted-foreground text-xs leading-relaxed">
        Tambahan member Rp {(coach.additionalHourPrice ?? coach.price).toLocaleString('id-ID')}
        /orang/jam · Maks. 100 member.
      </p>
    </div>
  );
}
