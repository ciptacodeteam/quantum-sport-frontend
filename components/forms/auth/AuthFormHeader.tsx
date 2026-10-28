import LogoImage from '@/assets/img/logoblack.webp';
import Image from 'next/image';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';

type Props = {
  title: string;
  description: string;
};

export default function AuthFormHeader({ title, description }: Props) {
  return (
    <header className="space-y-6">
      <div className="flex items-center gap-4 border-b border-black/15 pb-6">
        <Image src={LogoImage} alt="Black Padel" sizes="96px" className="h-auto w-24" />
        <span className="ml-auto text-[10px] tracking-[0.16em] text-black/45 uppercase">
          Your next rally starts here
        </span>
      </div>
      <div className="space-y-3">
        <p className="text-[10px] font-medium tracking-[0.18em] text-[#ad422b] uppercase">
          Black Padel / Member access
        </p>
        <DialogTitle className="text-[32px] leading-[1.05] font-medium tracking-[-0.05em] text-[#171717] uppercase sm:text-[40px]">
          {title}
        </DialogTitle>
        <DialogDescription className="max-w-xs text-sm leading-relaxed text-black/55">
          {description}
        </DialogDescription>
      </div>
    </header>
  );
}
