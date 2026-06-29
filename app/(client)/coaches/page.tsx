'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import WhatsAppAvatar from '@/assets/img/avatar.png';
import { getCoachTypeLabel } from '@/lib/constants';
import { coachesQueryOptions } from '@/queries/coach';
import { useQuery } from '@tanstack/react-query';
import { IconAward, IconUserStar } from '@tabler/icons-react';
import { FloatingWhatsApp } from 'react-floating-whatsapp';

const CoachesPage = () => {
  const { data, isLoading, isError } = useQuery(coachesQueryOptions);
  const coaches = data ?? [];

  return (
    <>
      <MainHeader backHref="/" title="Coach" withLogo={false} withBorder />

      <main className="mt-24 flex w-full flex-col pb-20">
        <section className="mx-auto w-11/12 max-w-7xl">
          <div className="mb-4 max-w-4xl border-b pb-4">
            <h1 className="text-primary text-xl leading-tight font-semibold tracking-normal">
              Choose Your Coach ( SR ACADEMY)
            </h1>
            <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
              Experience professional padel coaching with our certified and experienced coaches at
              Quantum Sports & Social Club, we offer structured training programs designed to help
              players of all levels, from beginners to competitive athletes, develop their skills
              and reach their full potential.
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
            <div className="grid gap-4 lg:grid-cols-2">
              {coaches.map((coach) => (
                <Card
                  key={coach.id}
                  className="overflow-hidden rounded-2xl border-zinc-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <Avatar className="size-24 shrink-0 rounded-2xl sm:size-28">
                        <AvatarImage src={coach.image || undefined} alt={coach.name} />
                        <AvatarFallback className="bg-primary/10 text-primary rounded-2xl font-semibold">
                          <IconUserStar className="size-10" stroke={1.8} />
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-start gap-2">
                          <h2 className="text-primary min-w-0 flex-1 text-xl leading-tight font-semibold">
                            {coach.name}
                          </h2>
                          <Badge
                            variant="secondary"
                            className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                          >
                            {getCoachTypeLabel(coach.coachType)}
                          </Badge>
                        </div>

                        {coach.achievements.length > 0 ? (
                          <ul className="space-y-3">
                            {coach.achievements.map((achievement) => (
                              <li
                                key={achievement}
                                className="text-muted-foreground grid grid-cols-[1.25rem_1fr] gap-3 text-sm leading-7 sm:text-base"
                              >
                                <IconAward className="text-primary mt-1 size-5" />
                                <span className="min-w-0">{achievement}</span>
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

      <FloatingWhatsApp
        phoneNumber="6282220805022"
        accountName="SR Academy"
        avatar={WhatsAppAvatar.src}
        statusMessage="Typically replies within 1 hour"
        chatMessage="Halo, ada yang bisa kami bantu tentang program coach SR Academy?"
        placeholder="Tulis pesan..."
        allowEsc
        notification
        notificationDelay={30}
        notificationLoop={1}
        className="coach-whatsapp-widget"
        buttonStyle={{ right: '1rem', bottom: '6rem' }}
        chatboxStyle={{ right: '1rem', bottom: '10.5rem' }}
      />
    </>
  );
};

export default CoachesPage;
