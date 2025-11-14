'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { bannersQueryOptions } from '@/queries/banner';
import type { Banner } from '@/types/model';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MembershipCtaSection from './MembershipCtaSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const DEFAULT_IMAGE = 'assets/img/banner.webp';
const DEFAULT_BANNERS = [
  {
    id: 'default-banner',
    image: DEFAULT_IMAGE
  }
];

const getBanners = (banners: Banner[] | undefined) => {
  if (!banners || banners.length === 0) {
    return DEFAULT_BANNERS;
  }

  const filtered = banners
    .filter((banner) => banner.isActive)
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  if (filtered.length === 0) {
    return DEFAULT_BANNERS;
  }

  return filtered;
};

export default function BannerSection() {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const { data } = useQuery(bannersQueryOptions());
  const banners = getBanners(data);

  // 🔥 Tambahan untuk mendapatkan embla API
  const [emblaApi, setEmblaApi] = useState<any>(null);

  // 🔥 Re-init ketika jumlah banner berubah
  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [banners.length, emblaApi]);

  return (
    <section className="mx-auto w-11/12 lg:max-w-7xl">
      {/* --- WRAPPER GRID UNTUK DESKTOP --- */}
      <div className="block grid-cols-5 lg:grid lg:gap-2">
        {/* LEFT: CAROUSEL (3/5) */}
        <div className="lg:col-span-3">
          <Carousel
            plugins={[plugin.current]}
            className="group/carousel relative lg:px-0"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            setApi={setEmblaApi}
          >
            <CarouselContent>
              {banners.map((banner, index) => {
                const image = banner.image || DEFAULT_IMAGE;

                const content = (
                  <Image
                    src={image}
                    alt={banner.id ? `Banner ${banner.id}` : `Banner ${index + 1}`}
                    width={1280}
                    height={720}
                    unoptimized
                    className="h-full w-full rounded-md bg-no-repeat object-cover md:rounded-lg"
                  />
                );

                return (
                  <CarouselItem className="basis-full" key={banner.id || `banner-${index}`}>
                    <div>
                      <Card className="py-0 shadow-none">
                        <CardContent className="flex min-h-40 items-center justify-center p-0 md:min-h-0">
                          {banner.link ? (
                            <a
                              href={banner.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block h-full w-full"
                            >
                              {content}
                            </a>
                          ) : (
                            content
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            <CarouselDots className="absolute bottom-0 left-1/2 mb-4 -translate-x-1/2 lg:bottom-2" />
          </Carousel>
        </div>

        {/* RIGHT: CTA (2/5) */}
        <div className="hidden lg:col-span-2 lg:block">
          <div className="bg-primary item relative h-full rounded-lg">
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="relative z-10 flex h-full flex-col justify-center items-center p-6">
                <h2 className="text-left font-semibold text-white md:text-3xl mt-28">
                  Gabung <br className="lg:hidden" />
                  Membership <br /> Sekarang!
                </h2>

                <span className="text-muted mt-4 text-left text-xs">
                  Dapatkan prioritas booking dan promo menarik lainnya!
                </span>
              </div>
              <div className="flex items-center justify-end">
                <Image
                  src="/assets/img/player.png"
                  alt="Membership Cta"
                  preload
                  width={500}
                  height={500}
                  className="absolute -bottom-30 right-0 h-auto w-[400px] -translate-y-1/2 object-contain"
                />
              </div>
            </div>
            <footer className="w-full px-6 flex">
              <Button asChild variant="secondary" className="mt-14 w-full">
                <Link href="/valuepack">Gabung Sekarang</Link>
              </Button>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
}
