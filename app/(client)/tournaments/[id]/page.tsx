'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tournamentDetailQueryOptions } from '@/queries/tournament';
import { formatNumber, getPlaceholderImageUrl, resolveMediaUrl } from '@/lib/utils';
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
      <MainHeader backHref="/tournaments" title="Detail Turnamen" withLogo={false} withBorder />
      <main className="mx-auto mt-24 flex w-11/12 max-w-7xl flex-col pb-16 lg:px-4">
        {isLoading && (
          <div className="text-muted-foreground py-20 text-center text-sm">
            Memuat detail turnamen...
          </div>
        )}

        {isError && !isLoading && (
          <div className="text-destructive py-20 text-center text-sm">
            Gagal memuat detail turnamen. Silakan coba lagi.
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {imageUrl && (
              <div className="relative h-60 w-full lg:h-72">
                <Image
                  src={imageUrl || getPlaceholderImageUrl(data.name)}
                  alt={data.name}
                  fill
                  className="rounded-lg object-cover"
                  sizes="100vw"
                  priority
                  unoptimized
                />
              </div>
            )}

            <div className="mx-auto w-11/12 flex-1 space-y-4 py-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>{status}</Badge>
                </div>
                <h1 className="text-2xl leading-tight font-bold lg:text-3xl">{data.name}</h1>
                {data.description && (
                  <p className="text-muted-foreground text-sm lg:text-base">{data.description}</p>
                )}
              </div>

              <Card>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <IconCalendar className="text-primary size-5" />
                    <span>
                      {dayjs(data.startDate).format('DD MMM YYYY')} -{' '}
                      {dayjs(data.endDate).format('DD MMM YYYY')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <IconClock className="text-primary size-5" />
                    <span>
                      {data.startTime} - {data.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <IconMapPin className="text-primary size-5" />
                    <span>{data.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <IconUsers className="text-primary size-5" />
                    <span>
                      Maks {data.maxTeams} tim • {data.teamSize} pemain / tim
                    </span>
                  </div>
                </CardContent>
              </Card>

              {data.rules && (
                <Card>
                  <CardContent className="space-y-2 px-4">
                    <h2 className="text-lg font-semibold">Peraturan Turnamen</h2>
                    <p
                      className="text-muted-foreground text-sm whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: data.rulesHtml }}
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase">Biaya Pendaftaran</p>
                  <p className="text-2xl font-bold">Rp {formatNumber(data.entryFee)}</p>
                  <Button className="mt-2 w-full lg:w-fit">Daftar Sekarang</Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default TournamentDetailPage;
