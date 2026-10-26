import Link from 'next/link';

const exploreItems = [
  { label: 'Find your next court', href: '/booking' },
  { label: 'Make time for tennis', href: '/booking/tennis' },
  { label: 'More play, more value', href: '/membership' },
  { label: 'Complete your game', href: '/add-ons' },
  { label: 'Meet us in Medan', href: '#locations-title' }
];

export default function BrandIntroSection() {
  return (
    <section
      aria-labelledby="brand-intro-title"
      className="hidden min-w-0 px-8 py-10 text-[#111111] lg:col-span-2 lg:row-start-2 lg:mt-6 lg:grid lg:grid-cols-[1.35fr_1fr] lg:gap-12 xl:px-10 xl:py-12"
    >
      <h2
        id="brand-intro-title"
        className="self-center text-[clamp(6rem,11vw,10rem)] leading-[0.88] font-normal tracking-[-0.075em]"
      >
        <span className="block">BLACK</span>
        <span className="block">PADEL</span>
      </h2>
      <div className="flex min-w-0 flex-col justify-between gap-8">
        <p className="ml-auto max-w-sm text-right text-sm leading-relaxed text-black/60">
          Make room for your next rally. From a spontaneous match to a weekly routine, find your
          court, choose your time, and make the game your own at Black Padel.
        </p>
        <ol className="border-t border-black/45">
          {exploreItems.map((item, index) => (
            <li key={item.label} className="border-b border-black/15">
              <Link
                href={item.href}
                className="flex min-h-10 items-center justify-between gap-6 py-2.5 text-[10px] font-medium tracking-[0.1em] uppercase transition-colors hover:text-[#ad422b] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ad422b]"
              >
                <span aria-hidden="true" className="shrink-0 text-black/45">
                  // {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-right">{item.label}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
