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
    <section className="mx-auto my-6 max-w-7xl">
      <header className="flex-between px-4 py-2">
        <h2 className="text-lg font-semibold lg:text-xl">Partners & Sponsorship</h2>
      </header>

      <main className="mx-auto py-4">
        <div className="relative overflow-hidden">
          <Marquee autoFill speed={50}>
            {[...sponsorList, ...sponsorList].map((client, i) => (
              <Image
                key={`${client.name}-${i}`}
                src={client.image}
                alt={client.name}
                className="h-auto w-32 object-contain px-4 transition duration-300 ease-in-out sm:h-12 md:w-42 lg:w-42 lg:px-4"
                width={300}
                height={300}
              />
            ))}
          </Marquee>
        </div>
      </main>
    </section>
  );
};
export default SponsorshipMarqueSection;
