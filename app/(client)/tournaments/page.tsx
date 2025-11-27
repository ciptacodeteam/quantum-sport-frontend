'use client';

import MainHeader from '@/components/headers/MainHeader';
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
    <Card className="mt-3 overflow-hidden">
      {imageUrl && (
        <div className="relative aspect-video w-full">
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

      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold">{tournament.name}</h3>
            {tournament.description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">{tournament.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <IconCalendar className="text-primary size-5" />
            <span>{formatDateRange(tournament.startDate, tournament.endDate)}</span>
          </div>
          <div className="flex items-center gap-3">
            <IconClock className="text-primary size-5" />
            <span>
              {tournament.startTime} - {tournament.endTime} WIB
            </span>
          </div>
          <div className="flex items-center gap-3">
            <IconMapPin className="text-primary size-5" />
            <span>{tournament.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <IconUsers className="text-primary size-5" />
            <span>
              Max {tournament.maxTeams} teams • {tournament.teamSize} players / team
            </span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Entry Fee</p>
            <p className="text-primary text-xl font-semibold">
              Rp{formatNumber(tournament.entryFee)}
            </p>
          </div>
          <Button onClick={onClick} variant="outline">
            Lihat Detail
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
      <MainHeader backHref="/" title="Turnamen" withLogo={false} withBorder/>

      <main>
        <div className="sticky z-10 w-full border-b bg-white md:top-14">
          <div className="mx-auto w-11/12 pt-24 pb-3 md:pt-10">
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari turnamen berdasarkan nama..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mx-auto w-11/12 pb-4">
            <Tabs value={tab} onValueChange={(value) => setTab(value as 'active' | 'all')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Sedang Berjalan</TabsTrigger>
                <TabsTrigger value="all">Semua Turnamen</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="mx-auto w-11/12 flex-1 py-2">
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
              {search ? `Tidak ada turnamen dengan kata kunci.` : 'Belum ada turnamen tersedia.'}
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
    </>
  );
};

export default TournamentsPage;
