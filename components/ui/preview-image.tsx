'use client';

import { cn, getPlaceholderImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';

type Props = {
  src: string | null | undefined;
  className?: string;
};

const PreviewImage = ({ src, className }: Props) => {
  return (
    <div>
      <Dialog>
        <DialogTrigger>
          <Image
            src={src || getPlaceholderImageUrl({ width: 160, height: 90 })}
            alt="Banner Image"
            width={160}
            height={90}
            unoptimized
            className={cn(
              'max-h-[90px] max-w-36 cursor-pointer rounded-md object-cover',
              className
            )}
          />
        </DialogTrigger>
        <DialogContent className="lg:min-w-xl">
          <DialogHeader>
            <DialogTitle>Preview Gambar</DialogTitle>
          </DialogHeader>
          <Image
            src={src || getPlaceholderImageUrl({ width: 640, height: 360 })}
            alt="Banner Image"
            width={640}
            height={360}
            unoptimized
            className="mt-4 max-h-80 w-full rounded-md object-cover"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default PreviewImage;
