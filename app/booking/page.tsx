import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';

const BookingPage = () => {
  return (
    <>
      <MainHeader />
      <main className="mt-0 mb-[28%] w-full md:mt-14">
        <h1>Booking Page</h1>
      </main>
      <BottomNavigationWrapper className="pb-4">
        <header className="flex-between my-2 items-end">
          <div>
            <span className="text-muted-foreground text-xs">Subtotal</span>
            <h2 className="text-lg font-semibold">Rp 200.000</h2>
          </div>

          <div>
            <span className="text-muted-foreground text-xs">1 Court, 2 Hours</span>
          </div>
        </header>

        <main>
          <Button className="w-full" size={'lg'}>
            Proceed to Payment
          </Button>
        </main>
      </BottomNavigationWrapper>
    </>
  );
};
export default BookingPage;
