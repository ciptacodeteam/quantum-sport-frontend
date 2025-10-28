import { Button } from '@/components/ui/button';
import Image from 'next/image';

const MembershipCtaSection = () => {
  return (
    <section className="mx-auto my-6 max-w-7xl px-4">
      <div className="bg-primary rounded-lg text-center">
        <div className="grid max-h-60 grid-cols-1 place-content-center items-center gap-6 sm:grid-cols-2">
          <div className="relative z-10 flex flex-col items-start p-6 md:p-10">
            <h2 className="text-left text-2xl font-semibold text-white md:text-3xl">
              Gabung <br className="hidden sm:block lg:hidden" />
              Membership <br /> Sekarang!
            </h2>

            <Button variant="secondary" className="mt-4">
              Join Now
            </Button>

            <span className="text-muted mt-4 text-left text-xs">
              Dapatkan prioritas booking dan promo menarik lainnya!
            </span>
            <div className="absolute top-1/2 right-10 z-0 block h-[270px] w-3 -translate-y-1/2 -rotate-16 rounded bg-white sm:hidden md:right-2/4 md:h-[300px]"></div>
          </div>
          <div className="relative hidden items-center justify-end sm:flex">
            <div className="absolute top-1/2 right-40 z-0 h-[270px] w-3 -translate-y-1/2 -rotate-16 rounded bg-white md:h-[300px]"></div>

            <div className="relative">
              <Image
                src="/assets/img/player.png"
                alt="Membership Cta"
                preload
                width={500}
                height={500}
                className="w-auto min-w-[280px] object-contain md:h-80"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default MembershipCtaSection;
