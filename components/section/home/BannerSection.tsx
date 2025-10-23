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
import { useRef } from 'react';

export default function BannerSection() {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 lg:py-16 xl:px-0">
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
                <Card className="shadow-none">
                  <CardContent className="flex min-h-40 items-center justify-center p-6 md:min-h-72">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="invisible -left-4.5 size-12 shadow-md lg:group-hover/carousel:visible" />
        <CarouselNext className="invisible -right-4.5 size-12 shadow-md lg:group-hover/carousel:visible" />
        <CarouselDots className="absolute bottom-0 left-1/2 mb-6 -translate-x-1/2 lg:invisible" />
      </Carousel>
    </section>
  );
}
