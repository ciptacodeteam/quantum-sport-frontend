import { ArrowUpRight, Clock3, MapPin, Star } from 'lucide-react';
import LocationMap from './LocationMap';
import { clubLocations } from '@/lib/club-locations';

export default function LocationsSection() {
  return (
    <section
      aria-labelledby="locations-title"
      className="mt-0 min-w-0 pb-4 md:col-span-2 md:row-start-2 md:mt-6 md:pb-8 lg:row-start-3"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2
          id="locations-title"
          className="scroll-mt-28 text-lg font-medium tracking-tight text-[#171717] sm:text-2xl"
        >
          Lokasi kami
        </h2>
        <span className="text-[10px] tracking-[0.12em] text-[#ad422b] uppercase">
          Find your court
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
        {clubLocations.map((location) => (
          <article
            key={location.id}
            className="min-w-0 overflow-hidden border border-black/10 bg-[#f8f8f6] transition-colors hover:border-[#ad422b]/40"
          >
            <LocationMap
              name={location.name}
              coordinates={location.coordinates}
              mapsUrl={location.mapsUrl}
            />
            <a
              href={location.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Lihat ${location.name} di Google Maps: ${location.address}`}
              className="group flex flex-col focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ad422b]"
            >
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="mb-3 text-lg leading-snug font-medium tracking-tight text-[#171717] sm:text-xl">
                  {location.name}
                </h3>
                <div className="mb-2 flex items-center gap-1.5 text-xs text-black/55 sm:gap-2 sm:text-xs">
                  <Clock3
                    className="size-3 shrink-0 text-[#ad422b] sm:size-3.5"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span>{location.openingHours}</span>
                </div>
                <div className="mb-4 flex items-start gap-1.5 sm:gap-2">
                  <MapPin
                    className="mt-0.5 size-3 shrink-0 text-[#ad422b] sm:size-3.5"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <address
                    title={location.address}
                    className="text-xs leading-relaxed text-black/55 not-italic sm:text-xs"
                  >
                    {location.address}
                  </address>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/10 pt-3">
                  <span className="flex items-center gap-1 text-sm text-[#171717] sm:text-sm">
                    <Star
                      className="size-3 fill-[#ad422b] text-[#ad422b] sm:size-3.5"
                      aria-hidden="true"
                    />
                    <span className="font-medium">{location.rating}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs font-medium text-[#ad422b]">
                    Lihat di Google Maps
                    <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </div>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
