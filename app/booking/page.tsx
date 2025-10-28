'use client';
import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { IconCalendarFilled, IconInfoCircle } from '@tabler/icons-react';

import { useState } from 'react';

const mockDates = [
  { label: 'Sab', date: '22 Nov', active: true },
  { label: 'Min', date: '23 Nov' },
  { label: 'Sen', date: '24 Nov' },
  { label: 'Sel', date: '25 Nov' },
  { label: 'Rab', date: '26 Nov' }
];
const mockCourts = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];
const mockTimes = [
  '06:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00'
];
const mockPrices = 350000;
const mockBooked = { '22 Nov': { 'Court 1': ['06:00'], 'Court 2': [] } };

function isBooked(date: string, court: string, time: string) {
  return mockBooked[date]?.[court]?.includes(time);
}

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState('22 Nov');
  const [selectedCell, setSelectedCell] = useState<{ court: string; time: string } | null>(null);

  return (
    <>
      <MainHeader backHref="/" />
      <main className="mt-4 mb-[32%] w-full md:mt-14">
        {/* Date selector */}
        <div className="flex items-center gap-2 border-b pb-2">
          <div className="flex items-center pl-2">
            <Button variant="light" size={'icon-lg'} className="p-2">
              <IconCalendarFilled className="text-primary size-6" />
            </Button>
          </div>
          <Separator orientation="vertical" className="h-10!" />
          <div className="flex gap-1">
            {mockDates.map((d) => (
              <button
                key={d.date}
                className={cn(
                  `flex flex-col items-center rounded px-3 py-1.5 font-semibold`,
                  selectedDate === d.date ? 'bg-green-900 text-white!' : 'hover:bg-muted',
                  !d.active && 'text-muted-foreground'
                )}
                onClick={() => setSelectedDate(d.date)}
              >
                <span className="text-xs">{d.label}</span>
                <span className="text-xs font-bold">{d.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Booking grid */}
        <div className="overflow-x-auto">
          <table className="table min-w-full border-separate border-spacing-0 rounded-lg text-center">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-r border-b bg-white px-2 py-2 text-left font-semibold">
                  {' '}
                </th>
                {mockCourts.map((court) => (
                  <th key={court} className="border-b px-4 py-2 text-xs font-semibold odd:border-x">
                    <Button variant={'ghost'}>
                      {court}
                      <IconInfoCircle className="inline-block size-4" />
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTimes.map((time) => (
                <tr key={time}>
                  <td className="sticky left-0 z-10 border-r border-b bg-white px-2 py-2 text-left text-xs font-semibold">
                    {time}
                  </td>
                  {mockCourts.map((court) => {
                    const booked = isBooked(selectedDate, court, time);
                    const selected = selectedCell?.court === court && selectedCell?.time === time;
                    return (
                      <td key={court} className="border-r border-b p-1">
                        <button
                          disabled={booked}
                          className={cn(
                            `flex h-14 w-full flex-col items-start justify-between rounded px-2 py-1 text-base font-semibold transition-all`,
                            booked
                              ? 'bg-muted text-muted-foreground border-muted'
                              : selected
                                ? 'border-green-900 bg-green-900 text-white shadow-lg'
                                : 'border-gray-200 bg-white hover:bg-green-100'
                          )}
                          onClick={() => setSelectedCell({ court, time })}
                        >
                          <span>
                            {mockPrices.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                          </span>
                          {booked && <span className="text-xs">booked</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
