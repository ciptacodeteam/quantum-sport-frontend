'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { membershipsQueryOptions } from '@/queries/membership';
import { useQuery } from '@tanstack/react-query';

export default function ValuePackPage() {
  const { data, isLoading, isError } = useQuery(membershipsQueryOptions());

  const valuePacks = data ?? [];

  return (
    <>
      <MainHeader backHref="/" title="Value Pack" withLogo={false} />

      <main className="mx-auto mt-28 flex w-11/12 flex-col gap-4 pb-12">
        {isLoading && (
          <div className="text-muted-foreground py-10 text-center text-sm">
            Memuat membership...
          </div>
        )}

        {isError && !isLoading && (
          <div className="text-destructive py-10 text-center text-sm">
            Gagal memuat membership. Silakan coba lagi.
          </div>
        )}

        {!isLoading && !isError && valuePacks.length === 0 && (
          <div className="text-muted-foreground py-10 text-center text-sm">
            Membership belum tersedia.
          </div>
        )}

        <main className="mx-auto flex w-11/12 flex-col gap-4 pt-28 pb-12">
          {valuePacks.map((pack) => (
            <Card key={pack.id} className="shadow-xs">
              <CardHeader>
                <CardTitle className={`font-semibold uppercase`}>{pack.name}</CardTitle>
                <CardDescription>
                  <div className="mb-2">
                    <span className="text-primary text-xl font-bold">
                      Rp{pack.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <ul className="text-muted-foreground list-outside list-disc space-y-1 pl-4">
                    {pack.benefits?.map((feature, idx) => (
                      <li key={idx}>{feature.benefit}</li>
                    ))}
                  </ul>
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="w-full" size={'lg'}>
                  Pesan Sekarang
                </Button>
              </CardFooter>
            </Card>
          ))}
        </main>
      </main>
    </>
  );
}
