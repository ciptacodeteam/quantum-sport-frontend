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
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { useRef } from 'react';

export default function BannerSection() {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  return (
    <section className="mx-auto my-8 mt-4 max-w-7xl px-4 md:my-12 md:px-6 lg:my-16 lg:pb-12 xl:px-0">
      <Carousel
        plugins={[plugin.current]}
        className="group/carousel relative mx-auto w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="py-0 shadow-none">
                  <CardContent className="flex min-h-40 items-center justify-center p-0 md:min-h-72">
                    <Image
                      src={'assets/img/banner-1.png'}
                      alt={`Banner ${index + 1}`}
                      width={1200}
                      unoptimized
                      height={300}
                      className="max-h-52 w-full rounded-md object-cover lg:max-h-80"
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="invisible -left-4.5 size-12 shadow-md lg:group-hover/carousel:visible" />
        <CarouselNext className="invisible -right-4.5 size-12 shadow-md lg:group-hover/carousel:visible" />
        <CarouselDots className="absolute bottom-0 left-1/2 mb-5 -translate-x-1/2 lg:invisible" />
      </Carousel>
    </section>
  );
}
