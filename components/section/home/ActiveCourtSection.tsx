import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import Image from 'next/image';
import Link from 'next/link';

type CourtItem = {
  name: string;
  image: string;
  startingPrice: number;
};

const courtList: CourtItem[] = [
  {
    name: 'Court 1',
    image: '/assets/img/court-1.jpg',
    startingPrice: 250000
  },
  {
    name: 'Court 2',
    image: '/assets/img/court-2.jpg',
    startingPrice: 150000
  },
  {
    name: 'Court 3',
    image: '/assets/img/court-2.jpg',
    startingPrice: 200000
  },
  {
    name: 'Court 4',
    image: '/assets/img/court-1.jpg',
    startingPrice: 250000
  },
  {
    name: 'Court 5',
    image: '/assets/img/court-2.jpg',
    startingPrice: 300000
  }
];

const ActiveCourtSection = () => {
  return (
    <section className="mx-auto my-12 max-w-7xl px-4">
      <header className="flex-between py-2">
        <h2 className="text-lg font-semibold lg:text-xl">Active Courts</h2>
        <Link
          href="#"
          prefetch
          className="text-primary text-sm font-medium hover:underline md:text-base"
        >
          See All
        </Link>
      </header>

      <main className="py-4">
        <Carousel className="group/carousel relative mx-auto w-full">
          <CarouselContent className="max-w-80">
            {courtList.map((court, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card className="min-h-72 max-w-80 gap-y-0 overflow-hidden pt-0 shadow-none">
                    <CardHeader className="px-0">
                      <Image
                        src={court.image}
                        alt={court.name}
                        width={320}
                        height={180}
                        className="h-52 w-full object-cover"
                      />
                    </CardHeader>
                    <CardContent className="space-y-1 px-4 pt-2 pb-2">
                      <div className="flex flex-col items-start gap-1">
                        <span className="line-clamp-2 text-base font-semibold md:text-lg">
                          {court.name}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          Mulai{' '}
                          <span className="text-foreground text-base font-bold md:text-lg">
                            Rp {court.startingPrice.toLocaleString('id-ID')}
                          </span>
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="px-4 pt-4 pb-0">
                      <Link href="#" prefetch className="w-full">
                        <Button className="w-full">Book Now</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="invisible -left-4.5 size-12 shadow-md lg:group-hover/carousel:visible" />
          <CarouselNext className="invisible -right-4.5 size-12 shadow-md lg:group-hover/carousel:visible" />
        </Carousel>
      </main>
    </section>
  );
};
export default ActiveCourtSection;
