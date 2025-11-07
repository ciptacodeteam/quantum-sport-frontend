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
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

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

  return (
    <section className="mx-auto lg:max-w-7xl w-11/12">
      <Carousel
        plugins={[plugin.current]}
        className="group/carousel relative mx-auto w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {banners.map((banner, index) => {
            const image = banner.image || DEFAULT_IMAGE;
            const content = (
              <Image
                src={image}
                alt={banner.id ? `Banner ${banner.id}` : `Banner ${index + 1}`}
                width={1200}
                height={300}
                unoptimized
                className="max-h-52 w-full rounded-md object-cover lg:max-h-80"
              />
            );

            return (
              <CarouselItem key={banner.id || `banner-${index}`}>
                <div>
                  <Card className="py-0 shadow-none">
                    <CardContent className="flex min-h-40 items-center justify-center p-0 md:min-h-72">
                      {banner.link ? (
                        <a href={banner.link} target="_blank" rel="noopener noreferrer">
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
        {/* <CarouselPrevious className="invisible -left-4.5 size-12 shadow-md lg:group-hover/carousel:visible" />
        <CarouselNext className="invisible -right-4.5 size-12 shadow-md lg:group-hover/carousel:visible" /> */}
        <CarouselDots className="absolute bottom-0 left-1/2 mb-4 -translate-x-1/2 lg:invisible" />
      </Carousel>
    </section>
  );
}
