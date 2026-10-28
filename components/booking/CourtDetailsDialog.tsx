'use client';

import { ImageOff } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

type Props = {
  court: { name: string; image?: string | null; description?: string | null } | null;
  onClose: () => void;
};

export default function CourtDetailsDialog({ court, onClose }: Props) {
  const [failedImage, setFailedImage] = useState<string | null>(null);

  return (
    <Dialog
      open={!!court}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none border-black/15 bg-[#f8f8f6] p-5 text-[#171717] [--color-ring:#555555] sm:max-w-[560px] sm:p-7">
        {court && (
          <>
            <DialogHeader className="gap-2 border-b border-black/15 pb-5 text-left">
              <p className="pr-6 text-[10px] font-medium tracking-[0.16em] text-[#ad422b] uppercase">
                Black Padel / Court details
              </p>
              <DialogTitle className="text-3xl font-medium tracking-tight text-[#171717]">
                {court.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detail lapangan {court.name}
              </DialogDescription>
            </DialogHeader>
            {court.image && failedImage !== court.image ? (
              <div className="overflow-hidden border border-black/15">
                <Image
                  src={court.image}
                  alt={court.name}
                  width={720}
                  height={480}
                  className="aspect-[3/2] w-full object-cover"
                  unoptimized
                  onError={() => setFailedImage(court.image ?? null)}
                />
              </div>
            ) : (
              <div className="flex aspect-[3/2] flex-col items-center justify-center gap-3 border border-dashed border-black/20 bg-white/50 p-6 text-center">
                <ImageOff className="size-8 text-black/25" strokeWidth={1} aria-hidden="true" />
                <p className="text-xs text-black/45">Foto lapangan belum tersedia.</p>
              </div>
            )}
            {court.description && (
              <p className="text-sm leading-relaxed text-black/55">{court.description}</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
