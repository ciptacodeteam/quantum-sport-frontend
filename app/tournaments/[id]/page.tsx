'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tournamentDetailQueryOptions } from '@/queries/tournament';
import { formatNumber, resolveMediaUrl } from '@/lib/utils';
import { IconCalendar, IconClock, IconMapPin, IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useParams } from 'next/navigation';

const TournamentDetailPage = () => {
  const params = useParams();
  const tournamentId = params.id as string;

  const { data, isLoading, isError } = useQuery(tournamentDetailQueryOptions(tournamentId));
  const imageUrl = resolveMediaUrl(data?.image);

  const status = data
    ? dayjs(data.endDate).isBefore(dayjs())
      ? 'Selesai'
      : dayjs(data.startDate).isAfter(dayjs())
        ? 'Segera dimulai'
        : 'Sedang berlangsung'
    : '';

  return (
    <>
      <MainHeader backHref="/tournaments" title="Detail Turnamen" withLogo={false} />
      <main className="mt-24 w-full md:mt-14 flex flex-col min-h-[calc(100dvh-96px)] pb-20">
        {isLoading && (
          <div className="text-muted-foreground py-20 text-center text-sm">Memuat detail turnamen...</div>
        )}

        {isError && !isLoading && (
          <div className="text-destructive py-20 text-center text-sm">
            Gagal memuat detail turnamen. Silakan coba lagi.
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {imageUrl && (
              <div className="relative h-64 w-full">
                <Image src={imageUrl} alt={data.name} fill className="object-cover" sizes="100vw" priority unoptimized />
              </div>
            )}

            <div className="w-11/12 mx-auto flex-1 py-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>{status}</Badge>
                  {data.isActive ? (
                    <Badge variant="success">Aktif</Badge>
                  ) : (
                    <Badge variant="secondary">Tidak aktif</Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold leading-tight">{data.name}</h1>
                {data.description && <p className="text-muted-foreground">{data.description}</p>}
              </div>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <IconCalendar className="size-4 text-primary" />
                    <span>
                      {dayjs(data.startDate).format('DD MMM YYYY')} - {dayjs(data.endDate).format('DD MMM YYYY')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <IconClock className="size-4 text-primary" />
                    <span>
                      {data.startTime} - {data.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <IconMapPin className="size-4 text-primary" />
                    <span>{data.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <IconUsers className="size-4 text-primary" />
                    <span>
                      Maks {data.maxTeams} tim • {data.teamSize} pemain / tim
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs uppercase text-muted-foreground">Biaya Pendaftaran</p>
                  <p className="text-2xl font-semibold">Rp {formatNumber(data.entryFee)}</p>
                  <Button className="w-full mt-4">Hubungi Admin Untuk Pendaftaran</Button>
                </CardContent>
              </Card>

              {data.rules && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h2 className="text-lg font-semibold">Peraturan Turnamen</h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{data.rules}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
      <BottomNavigationWrapper>
        <div className="flex-center py-3">
          <p className="text-xs text-muted-foreground text-center">
            Hubungi tim Quantum Sport untuk informasi lebih lanjut.
          </p>
        </div>
      </BottomNavigationWrapper>
    </>
  );
};

export default TournamentDetailPage;

