'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber, resolveMediaUrl } from '@/lib/utils';
import { activeTournamentsQueryOptions, allTournamentsQueryOptions } from '@/queries/tournament';
import { IconCalendar, IconClock, IconMapPin, IconSearch, IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const formatDateRange = (start: string | Date, end: string | Date) => {
  const startDay = dayjs(start).format('DD MMM YYYY');
  const endDay = dayjs(end).format('DD MMM YYYY');
  if (startDay === endDay) return startDay;
  return `${startDay} - ${endDay}`;
};

const TournamentCard = ({ tournament, onClick }: { tournament: any; onClick: () => void }) => {
  const imageUrl = resolveMediaUrl(tournament.image ?? undefined);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={tournament.name}
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {dayjs(tournament.startDate).diff(dayjs(), 'day') >= 0 ? 'Upcoming' : 'Completed'}
            </Badge>
          </div>
        </div>
      )}
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{tournament.name}</h3>
            {tournament.description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">{tournament.description}</p>
            )}
          </div>
        </div>
        <div className="text-muted-foreground grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <IconCalendar className="size-4" />
            <span>{formatDateRange(tournament.startDate, tournament.endDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconClock className="size-4" />
            <span>
              {tournament.startTime} - {tournament.endTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconMapPin className="size-4" />
            <span>{tournament.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconUsers className="size-4" />
            <span>
              Max {tournament.maxTeams} teams • {tournament.teamSize} players / team
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase">Entry Fee</p>
            <p className="text-base font-semibold">Rp {formatNumber(tournament.entryFee)}</p>
          </div>
          <Button onClick={onClick} variant="outline">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TournamentsPage = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'active' | 'all'>('active');

  const {
    data: activeTournaments,
    isLoading: isLoadingActive,
    isError: isActiveError
  } = useQuery(activeTournamentsQueryOptions());

  const {
    data: allTournaments,
    isLoading: isLoadingAll,
    isError: isAllError
  } = useQuery(allTournamentsQueryOptions());

  const filteredActive = useMemo(() => {
    if (!activeTournaments) return [];
    return activeTournaments.filter((tournament: any) =>
      tournament.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [activeTournaments, search]);

  const filteredAll = useMemo(() => {
    if (!allTournaments) return [];
    return allTournaments.filter((tournament: any) =>
      tournament.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [allTournaments, search]);

  const isLoading = tab === 'active' ? isLoadingActive : isLoadingAll;
  const isError = tab === 'active' ? isActiveError : isAllError;
  const dataset = tab === 'active' ? filteredActive : filteredAll;

  return (
    <>
      <MainHeader backHref="/" title="Turnamen" withLogo={false} />
      <main className="mt-28 flex min-h-[calc(100dvh-96px)] w-full flex-col pb-20">
        <header className="z-10">
          <div className="mx-auto w-11/12 max-w-7xl space-y-4 py-5">
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari turnamen berdasarkan nama..."
                className="pl-10"
              />
            </div>
            <Tabs value={tab} onValueChange={(value) => setTab(value as 'active' | 'all')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Sedang Berjalan</TabsTrigger>
                <TabsTrigger value="all">Semua Turnamen</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        <div className="mx-auto w-11/12 max-w-7xl flex-1 py-6">
          {isLoading && (
            <div className="text-muted-foreground py-20 text-center text-sm">
              Memuat turnamen...
            </div>
          )}

          {isError && !isLoading && (
            <div className="text-destructive py-20 text-center text-sm">
              Gagal memuat data turnamen. Silakan coba lagi.
            </div>
          )}

          {!isLoading && !isError && dataset.length === 0 && (
            <div className="text-muted-foreground py-20 text-center text-sm">
              {search
                ? `Tidak ada turnamen dengan kata kunci "${search}".`
                : 'Belum ada turnamen tersedia.'}
            </div>
          )}

          {!isLoading && !isError && dataset.length > 0 && (
            <div className="space-y-4">
              {dataset.map((tournament: any) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onClick={() => router.push(`/tournaments/${tournament.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNavigationWrapper>
        <div className="flex-center py-3">
          <p className="text-muted-foreground text-center text-xs">
            Dapatkan informasi terbaru turnamen yang diselenggarakan Quantum Sport.
          </p>
        </div>
      </BottomNavigationWrapper>
    </>
  );
};

export default TournamentsPage;
