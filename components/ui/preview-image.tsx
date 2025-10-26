'use client';

import { getPlaceholderImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';

type Props = {
  src: string | null | undefined;
};

const PreviewImage = ({ src }: Props) => {
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
            className="max-h-[90px] max-w-36 cursor-pointer rounded-md object-cover"
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
