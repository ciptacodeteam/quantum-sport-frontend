'use client';

import Image from 'next/image';
import Marquee from 'react-fast-marquee';

type SponsorItem = {
  name: string;
  image: string;
};

const sponsorList: SponsorItem[] = [
  {
    name: 'Sponsor 1',
    image: '/assets/img/sponsor-1.svg'
  },
  {
    name: 'Sponsor 2',
    image: '/assets/img/sponsor-1.svg'
  },
  {
    name: 'Sponsor 3',
    image: '/assets/img/sponsor-1.svg'
  },
  {
    name: 'Sponsor 4',
    image: '/assets/img/sponsor-1.svg'
  },
  {
    name: 'Sponsor 5',
    image: '/assets/img/sponsor-1.svg'
  }
];

const SponsorshipMarqueSection = () => {
  return (
    <section className="mx-auto my-6 lg:max-w-7xl w-11/12">
      <header className="flex-between py-2">
        <h2 className="text-xl text-primary font-semibold lg:text-xl">Partners & Sponsorship</h2>
      </header>

      <main className="mx-auto py-4">
        <div className="relative overflow-hidden">
          {/* left gradient overlay */}
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-linear-to-r from-white via-white/80 to-transparent" />

          {/* right gradient overlay */}
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-linear-to-l from-white via-white/80 to-transparent" />

          <Marquee autoFill speed={50}>
            {[...sponsorList, ...sponsorList].map((client, i) => (
              <Image
                key={`${client.name}-${i}`}
                src={client.image}
                alt={client.name}
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
