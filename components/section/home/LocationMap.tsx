'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { Component, useEffect, useRef, useState, type ReactNode } from 'react';

export type LocationMapProps = {
  name: string;
  coordinates: readonly [number, number];
  mapsUrl: string;
};

function MapPlaceholder() {
  return (
    <div
      className="flex h-full items-center justify-center bg-[#efeee9] text-[#ad422b]"
      aria-hidden="true"
    >
      <MapPin className="size-9" strokeWidth={1.25} />
    </div>
  );
}

const LocationMapCanvas = dynamic(() => import('./LocationMapCanvas'), {
  ssr: false,
  loading: MapPlaceholder
});

class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <MapPlaceholder /> : this.props.children;
  }
}

export default function LocationMap({ name, coordinates, mapsUrl }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-56 overflow-hidden border-b border-black/10 bg-[#efeee9] sm:h-72 lg:h-80"
    >
      <MapErrorBoundary>
        {visible ? <LocationMapCanvas name={name} coordinates={coordinates} /> : <MapPlaceholder />}
      </MapErrorBoundary>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Buka peta ${name} di Google Maps`}
        className="absolute inset-x-0 top-0 bottom-8 z-10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#ad422b]"
      />
    </div>
  );
}
