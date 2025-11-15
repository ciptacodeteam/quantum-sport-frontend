'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { activeTournamentsQueryOptions, allTournamentsQueryOptions } from '@/queries/tournament';
import { formatNumber, resolveMediaUrl } from '@/lib/utils';
import { IconCalendar, IconMapPin, IconUsers, IconClock, IconSearch, IconChevronRight } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const formatDateRange = (start: string | Date, end: string | Date) => {
  const startDay = dayjs(start).format('DD MMM YYYY');
  const endDay = dayjs(end).format('DD MMM YYYY');
  if (startDay === endDay) return startDay;
  return `${startDay} - ${endDay}`;
};

const TournamentCard = ({ tournament, onClick }: { tournament: any; onClick: () => void }) => {
  const imageUrl = resolveMediaUrl(tournament.image ?? undefined);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {imageUrl && (
        <div className="relative h-48 w-full">
          <Image src={imageUrl} alt={tournament.name} fill className="object-cover" sizes="100vw" unoptimized />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {dayjs(tournament.startDate).diff(dayjs(), 'day') >= 0 ? 'Upcoming' : 'Completed'}
            </Badge>
          </div>
        </div>
      )}
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{tournament.name}</h3>
            {tournament.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{tournament.description}</p>
            )}
          </div>
          <IconChevronRight className="text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
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
            <p className="text-xs uppercase text-muted-foreground">Entry Fee</p>
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
      <main className="mt-24 w-full md:mt-14 flex flex-col min-h-[calc(100dvh-96px)] pb-20">
        <div className="bg-white border-b sticky top-24 md:top-14 z-10">
          <div className="w-11/12 mx-auto py-5 space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Ikuti Turnamen Terbaru</h1>
              <p className="text-sm text-muted-foreground">
                Temukan turnamen olahraga terbaik dan daftarkan tim Anda sekarang juga.
              </p>
            </div>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari turnamen berdasarkan nama..."
                className="pl-10"
              />
            </div>
            <Tabs value={tab} onValueChange={(value) => setTab(value as 'active' | 'all')}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="active">Sedang Berjalan</TabsTrigger>
                <TabsTrigger value="all">Semua Turnamen</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="w-11/12 mx-auto flex-1 py-6">
          {isLoading && (
            <div className="text-muted-foreground py-20 text-center text-sm">Memuat turnamen...</div>
          )}

          {isError && !isLoading && (
            <div className="text-destructive py-20 text-center text-sm">
              Gagal memuat data turnamen. Silakan coba lagi.
            </div>
          )}

          {!isLoading && !isError && dataset.length === 0 && (
            <div className="text-muted-foreground py-20 text-center text-sm">
              {search ? `Tidak ada turnamen dengan kata kunci "${search}".` : 'Belum ada turnamen tersedia.'}
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
          <p className="text-xs text-muted-foreground text-center">
            Dapatkan informasi terbaru turnamen yang diselenggarakan Quantum Sport.
          </p>
        </div>
      </BottomNavigationWrapper>
    </>
  );
};

export default TournamentsPage;

