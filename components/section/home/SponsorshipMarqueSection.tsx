'use client';

import Image from 'next/image';
import Marquee from 'react-fast-marquee';
import { useQuery } from '@tanstack/react-query';
import { partnershipsQueryOptions } from '@/queries/partnership';

const SponsorshipMarqueSection = () => {
  const { data: partnerships, isLoading } = useQuery(partnershipsQueryOptions());

  // Don't render if loading or no partnerships
  if (isLoading || !partnerships || partnerships.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto my-6 w-11/12 lg:max-w-7xl">
      <header className="flex-between py-2">
        <h2 className="text-primary text-xl font-semibold lg:text-xl">Partners & Sponsorship</h2>
      </header>

      <main className="mx-auto py-4">
        <div className="relative overflow-hidden">
          {/* left gradient overlay */}
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-linear-to-r from-white via-white/80 to-transparent" />

          {/* right gradient overlay */}
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-linear-to-l from-white via-white/80 to-transparent" />

          <Marquee autoFill speed={50}>
            {partnerships.map((logoUrl, i) => (
              <Image
                key={`sponsor-${i}`}
                src={logoUrl}
                alt={`Partner ${i + 1}`}
                className="h-auto w-30 object-contain px-4 transition duration-300 ease-in-out sm:h-12 md:w-42 lg:w-42 lg:px-4"
                width={200}
                height={200}
              />
            ))}
          </Marquee>
        </div>
      </main>
    </section>
  );
};
export default SponsorshipMarqueSection;
