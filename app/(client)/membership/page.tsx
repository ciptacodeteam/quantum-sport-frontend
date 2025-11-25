'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { membershipsQueryOptions } from '@/queries/membership';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function MembershipPage() {
  const { data, isLoading, isError } = useQuery(membershipsQueryOptions());
  const memberships = (data ?? []).filter((membership) => membership.isActive);

  return (
    <>
      <MainHeader backHref="/" title="Value Pack" withLogo={false} />

      <main className="mx-auto flex w-11/12 max-w-7xl flex-col gap-4 pb-12">
        {/* Loading state */}
        {isLoading && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground text-sm">Memuat membership...</p>
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-destructive text-sm">Gagal memuat membership. Silakan coba lagi.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && memberships.length === 0 && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg font-semibold">Belum ada Paket Membership</p>
            <p className="text-muted-foreground text-sm max-w-sm">
              Kami sedang menyiapkan paket terbaik untuk kamu. Silahkan tunggu beberapa saat.
            </p>
          </div>
        )}

        {/* Membership list */}
        {!isLoading && !isError && memberships.length > 0 && (
          <section className="grid gap-6 pt-28 pb-12 md:grid-cols-2 lg:grid-cols-3">
            {memberships.map((pack) => (
              <Card key={pack.id} className="flex flex-col">
                <CardHeader>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <CardTitle className="text-xl font-bold tracking-tight uppercase">
                      {pack.name}
                    </CardTitle>
                    {pack.isActive && (
                      <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                        Aktif
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-primary text-2xl font-bold">
                      Rp {pack.price.toLocaleString('id-ID')}
                    </div>

                    {/* Key Information */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <div className="flex items-center gap-1.5 text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-muted-foreground h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                        <span className="text-foreground font-medium">{pack.sessions}</span>
                        <span className="text-muted-foreground">Jam</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-muted-foreground h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-foreground font-medium">{pack.duration}</span>
                        <span className="text-muted-foreground">Hari</span>
                      </div>
                    </div>
                  </div>

                  {pack.description && (
                    <CardDescription className="line-clamp-2 pt-2">
                      {pack.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  {pack.benefits && pack.benefits.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Benefit:</h4>
                      <ul className="space-y-2">
                        {pack.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="text-primary mt-0.5 h-4 w-4 shrink-0"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-muted-foreground">{benefit.benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-4">
                  <Button className="w-full" size="lg" asChild>
                    <Link href={`/membership/${pack.id}`}>Pesan Sekarang</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
