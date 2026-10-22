const facilities = [
  'Padel Courts',
  'Tennis Courts',
  'Racket Rental',
  'Ball Rental',
  'Ballboy Service'
];

export default function BrandFacilitiesSection() {
  return (
    <section
      aria-labelledby="brand-facilities-title"
      className="mx-auto w-full max-w-7xl px-5 pt-8 pb-12 text-[#111111] sm:px-8 md:pt-9 md:pb-16"
    >
      <div className="grid min-w-0 grid-cols-1 gap-10 md:grid-cols-[1.85fr_1fr] md:gap-4">
        <h2
          id="brand-facilities-title"
          className="text-[clamp(4.5rem,12vw,10.5rem)] leading-[0.9] font-medium tracking-[-0.075em]"
        >
          <span className="block">BLACK</span>
          <span className="block">PADEL</span>
        </h2>

        <div className="flex min-w-0 flex-col justify-between gap-10 md:pt-2">
          <p className="text-sm leading-relaxed text-black/55 md:text-right">
            A space to play, connect, and enjoy the game. Everything you need for your next rally,
            right here at Black Padel.
          </p>

          <div>
            <h3 className="mb-3 text-[10px] font-medium tracking-[0.16em] text-black/50 uppercase md:text-right">
              Facilities
            </h3>
            <ol className="border-t border-black/40">
              {facilities.map((facility, index) => (
                <li
                  key={facility}
                  className="flex min-h-9 items-center justify-between gap-5 border-b border-black/10 py-2.5 text-[10px] font-medium tracking-[0.1em] uppercase"
                >
                  <span className="shrink-0 text-black/50" aria-hidden="true">
                    // {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-right text-black/70">{facility}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
