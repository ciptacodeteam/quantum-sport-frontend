'use client';

import { Map, MapMarker, MarkerContent } from '@/components/ui/map';
import { MapPin } from 'lucide-react';
import type { LocationMapProps } from './LocationMap';

const mapStyles = { light: '/assets/maps/black-padel.json', dark: '/assets/maps/black-padel.json' };

export default function LocationMapCanvas({
  name,
  coordinates
}: Pick<LocationMapProps, 'name' | 'coordinates'>) {
  return (
    <Map
      theme="light"
      styles={mapStyles}
      center={[coordinates[0], coordinates[1]]}
      zoom={15}
      interactive={false}
      attributionControl={{ compact: false }}
      className="h-full w-full [&_.maplibregl-canvas]:outline-none [&_.maplibregl-ctrl-attrib]:bg-[#f8f8f6]/95 [&_.maplibregl-ctrl-attrib]:text-[9px] [&_.maplibregl-ctrl-attrib]:text-black/55"
    >
      <MapMarker longitude={coordinates[0]} latitude={coordinates[1]} anchor="bottom">
        <MarkerContent className="flex flex-col items-center">
          <span className="mb-2 border border-black/10 bg-[#f8f8f6] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-[#171717] shadow-sm">
            {name}
          </span>
          <MapPin
            className="size-10 fill-[#ad422b] text-white drop-shadow-sm"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </MarkerContent>
      </MapMarker>
    </Map>
  );
}
