'use client';

import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '@/components/ui/carousel';
import { bannersQueryOptions } from '@/queries/banner';
import type { Banner } from '@/types/model';
import { useBranchStore } from '@/stores/useBranchStore';
import { useQuery } from '@tanstack/react-query';
import Autoplay from 'embla-carousel-autoplay';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import BranchLink from '@/components/branches/BranchLink';
import { useRef, useState } from 'react';
import MenuSection from './MenuSection';
import LocationsSection from './LocationsSection';
import BrandIntroSection from './BrandIntroSection';

const DEFAULT_IMAGE = '/assets/img/court-3.jpg';
const DEFAULT_BANNERS = [{ id: 'default-court', image: DEFAULT_IMAGE, link: null }];

const getBanners = (banners: Banner[] | undefined) => {
  const active = (banners ?? [])
    .filter((banner) => {
      if (!banner.isActive || !banner.image) return false;
      // Seed placeholders are replaced by the existing court photography.
      if (banner.image.includes('picsum.photos/')) return false;
      if (banner.link && /^\/(?:clubs|my-club|tournaments)(?:\/|\?|$)/.test(banner.link))
        return false;
      return true;
    })
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  return active.length ? active : DEFAULT_BANNERS;
};

export default function BannerSection() {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true })
  );
  const branchId = useBranchStore((state) => state.branch?.id);
  const { data } = useQuery({
    ...bannersQueryOptions(),
    queryKey: ['banners', branchId || 'unselected'],
    enabled: !!branchId
  });
  const banners = getBanners(data);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section aria-label="Bermain di Black Padel" className="mx-auto w-full max-w-7xl px-5 sm:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.85fr_1fr]">
        <div className="min-w-0">
          <Carousel
            opts={{ loop: banners.length > 1 }}
            plugins={banners.length > 1 ? [plugin.current] : []}
            className="min-w-0 overflow-hidden"
            aria-label="Foto dan penawaran lapangan"
          >
            <CarouselContent>
              {banners.map((banner, index) => {
                const content = (
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-200 md:aspect-[2.6/1] md:min-h-[240px]">
                    <Image
                      src={failedImages[banner.id] ? DEFAULT_IMAGE : banner.image || DEFAULT_IMAGE}
                      alt={`Lapangan padel Black Padel${banners.length > 1 ? ` — ${index + 1}` : ''}`}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1280px) 780px, (min-width: 768px) 65vw, 100vw"
                      unoptimized
                      className="object-cover"
                      onError={() =>
                        setFailedImages((previous) => ({ ...previous, [banner.id]: true }))
                      }
                    />
                  </div>
                );
                return (
                  <CarouselItem key={banner.id}>
                    {banner.link ? (
                      <a
                        href={banner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            {banners.length > 1 && (
              <CarouselDots className="absolute bottom-3 left-1/2 -translate-x-1/2" />
            )}
          </Carousel>
          <MenuSection />
        </div>

        <BrandIntroSection />

        <LocationsSection />

        <div className="flex min-h-[220px] flex-col justify-between gap-12 bg-[#111111] p-6 text-white md:min-h-0 md:gap-8 lg:p-7">
          <h1 className="max-w-sm text-base leading-snug font-medium uppercase lg:text-lg">
            Are you ready to make your first swing on a padel court?
          </h1>
          <BranchLink
            href="/booking"
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-3 text-[10px] font-medium tracking-[0.06em] uppercase transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Book a Court
            <ArrowUpRight className="size-3" strokeWidth={1.5} aria-hidden="true" />
          </BranchLink>
        </div>
      </div>
    </section>
  );
}
