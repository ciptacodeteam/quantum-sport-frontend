'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import type { Membership } from '@/types/model';
import { membershipsQueryOptions } from '@/queries/membership';
import { useQuery } from '@tanstack/react-query';

const formatFeatures = (membership: Membership) => {
  const description = membership.description ? [membership.description] : [];
  const summary = [
    membership.sessions ? `${membership.sessions.toLocaleString('id-ID')} sesi bermain` : null,
    membership.duration ? `Masa berlaku ${membership.duration.toLocaleString('id-ID')} hari` : null
  ].filter(Boolean) as string[];

  const contentLines = membership.content
    ? membership.content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];

  return [...description, ...summary, ...contentLines];
};

const ValuePackPage = () => {
  const { data, isLoading, isError } = useQuery(membershipsQueryOptions());

  const valuePacks = data ?? [];

  return (
    <>
      <MainHeader backHref="/" title="Value Pack" withLogo={false} />

      <main className="flex flex-col gap-4 mt-28 mx-auto w-11/12 pb-12">
        {isLoading && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Memuat membership...
          </div>
        )}

        {isError && !isLoading && (
          <div className="py-10 text-center text-sm text-destructive">
            Gagal memuat membership. Silakan coba lagi.
          </div>
        )}

        {!isLoading && !isError && valuePacks.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Membership belum tersedia.
          </div>
        )}

            <main className="flex flex-col gap-4 pt-28 mx-auto w-11/12 pb-12">
                {valuePacks.map((pack) => (
                    <Card key={pack.id} className="shadow-xs">
                        <CardHeader>
                            <CardTitle className={`uppercase font-semibold`}>
                                {pack.name}
                            </CardTitle>
                            <CardDescription>
                                <div className="mb-2">
                                    <span className="text-xl font-bold text-primary">
                                        Rp{pack.price.toLocaleString("id-ID")}
                                    </span>
                                </div>
                                <ul className="list-disc list-outside pl-4 space-y-1 text-muted-foreground">
                                    {pack.features.map((feature, idx) => (
                                        <li key={idx}>{feature}</li>
                                    ))}
                                </ul>
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button className="w-full" size={"lg"}>
                                Pesan Sekarang
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </main>    
       </main>
    </>
  );
};

export default ValuePackPage;
