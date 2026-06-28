'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { coachesQueryOptions } from '@/queries/coach';
import { useQuery } from '@tanstack/react-query';
import { IconAward, IconUserStar } from '@tabler/icons-react';

const coachTypeLabels: Record<string, string> = {
  COACH: 'Coach',
  GUIDED_MATCH: 'Guided Match'
};

const CoachesPage = () => {
  const { data, isLoading, isError } = useQuery(coachesQueryOptions);
  const coaches = data ?? [];

  return (
    <>
      <MainHeader backHref="/" title="Coach" withLogo={false} withBorder />

      <main className="mt-24 flex w-full flex-col pb-20">
        <section className="mx-auto w-11/12 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-primary text-2xl font-semibold">Pilih Coach</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Kenali coach Quantum Sport dari pengalaman dan portfolio latihannya.
            </p>
          </div>

          {isLoading && (
            <div className="text-muted-foreground py-20 text-center text-sm">
              Loading coach...
            </div>
          )}

          {isError && !isLoading && (
            <div className="text-destructive py-20 text-center text-sm">
              Gagal memuat data coach. Silahkan coba lagi.
            </div>
          )}

          {!isLoading && !isError && coaches.length === 0 && (
            <div className="text-muted-foreground py-20 text-center text-sm">
              Coach belum tersedia saat ini.
            </div>
          )}

          {!isLoading && !isError && coaches.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {coaches.map((coach) => (
                <Card key={coach.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="size-20 shrink-0 rounded-xl">
                        <AvatarImage src={coach.image || undefined} alt={coach.name} />
                        <AvatarFallback className="bg-primary/10 text-primary rounded-xl font-semibold">
                          <IconUserStar className="size-8" stroke={1.8} />
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-start gap-2">
                          <h2 className="text-primary flex-1 text-base leading-tight font-semibold">
                            {coach.name}
                          </h2>
                          {coach.coachType && (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {coachTypeLabels[coach.coachType] ?? coach.coachType}
                            </Badge>
                          )}
                        </div>

                        {coach.achievements.length > 0 ? (
                          <ul className="space-y-2">
                            {coach.achievements.map((achievement) => (
                              <li
                                key={achievement}
                                className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed"
                              >
                                <IconAward className="text-primary mt-0.5 size-4 shrink-0" />
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Portfolio coach belum ditambahkan.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default CoachesPage;
