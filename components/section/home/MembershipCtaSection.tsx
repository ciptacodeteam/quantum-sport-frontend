import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

const MembershipCtaSection = () => {
  return (
    <section className="mx-auto my-6 mt-12 mb-30 w-11/12 lg:hidden lg:max-w-7xl">
      <div className="bg-primary relative rounded-lg pb-4 text-center">
        <div className="grid grid-cols-2 place-content-center items-center gap-4">
          <div className="relative z-10 flex h-full flex-col items-start p-6 pt-10 md:p-10">
            <h2 className="text-left text-2xl font-semibold text-white md:text-3xl">
              Gabung <br className="lg:hidden" />
              Membership <br /> Sekarang!
            </h2>

            <span className="text-muted mt-4 text-left text-xs">
              Dapatkan prioritas booking dan promo menarik lainnya!
            </span>
          </div>
          <div className="flex items-center justify-end">
            <Image
              src="/assets/img/player.png"
              alt="Membership Cta"
              preload
              width={500}
              height={500}
              className="absolute top-1/3 right-0 h-auto w-[260px] -translate-y-1/2 object-contain"
            />
          </div>
        </div>
        <footer className="w-full px-4">
          <Button asChild variant="secondary" className="mt-4 w-full">
            <Link prefetch href="/clubs">
              Gabung Sekarang
            </Link>
          </Button>
        </footer>
      </div>
    </section>
  );
};
export default MembershipCtaSection;
