import { Button } from '@/components/ui/button';
import Image from 'next/image';

const MembershipCtaSection = () => {
  return (
    <section className="mx-auto my-12 max-w-7xl px-4">
      <div className="bg-primary rounded-lg p-6 text-center md:p-10">
        <div className="grid grid-cols-2 items-center gap-6">
          <div className="flex flex-col items-start">
            <h2 className="text-left text-2xl font-semibold text-white md:text-3xl">
              Gabung <br className="lg:hidden" />
              Membership <br /> Sekarang!
            </h2>

            <Button variant="secondary" className="mt-4">
              Join Now
            </Button>

            <span className="text-muted mt-4 text-left text-xs">
              Dapatkan prioritas booking dan promo menarik lainnya!
            </span>
          </div>
          <div className="relative">
            <div className="right absolute top-1/2 right-1/4 h-[270px] w-3 -translate-y-1/2 -rotate-16 rounded bg-white md:right-2/4 md:h-[300px]"></div>

            <div className="absolute top-1/2 -right-16 w-[290px] -translate-y-1/2 lg:-right-10 lg:w-[320px]">
              <Image
                src="/assets/img/player.png"
                alt="Membership Cta"
                preload
                width={256}
                height={256}
                className="w-full rotate-12 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default MembershipCtaSection;
