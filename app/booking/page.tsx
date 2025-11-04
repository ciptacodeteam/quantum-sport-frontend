'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { DatePickerModal, DatePickerModalTrigger } from '@/components/ui/date-picker-modal';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { IconCalendarFilled, IconInfoCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';

// mock data
const mockCourts = [
  { name: 'Court 1', image: '/assets/img/court-3.jpg' },
  { name: 'Court 2', image: '/assets/img/court-3.jpg' },
  { name: 'Court 3', image: '/assets/img/court-3.jpg' },
  { name: 'Court 4', image: '/assets/img/court-3.jpg' },
];

const mockTimes = [
  '06:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00'
];
const mockPrices = 350000;
const mockBooked = {
  '05 Nov': {
    'Court 1': ['06:00'],
    'Court 2': [],
    'Court 3': [],
    'Court 4': []
  }
};

function isBooked(date: string, court: string, time: string) {
  return mockBooked[date]?.[court]?.includes(time);
}

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('DD MMM'));
  const [selectedCell, setSelectedCell] = useState<{ court: string; time: string }[]>([]);
  const [dateList, setDateList] = useState<
    { label: string; date: string; fullDate: string; active?: boolean }[]
  >([]);
  const [selectedCourt, setSelectedCourt] = useState<null | typeof mockCourts[0]>(null);

  useEffect(() => {
    const today = dayjs();
    const endDate = today.add(3, 'month');
    const updatedDates: { label: string; date: string; fullDate: string; active?: boolean }[] = [];

    let current = today;
    while (current.isBefore(endDate)) {
      updatedDates.push({
        label: current.format('ddd'),
        date: current.format('DD MMM'),
        fullDate: current.format('YYYY-MM-DD'),
        active: current.isSame(today, 'day'),
      });
      current = current.add(1, 'day');
    }

    setDateList(updatedDates);
  }, []);

  const handleSelectDate = (date: Date | null) => {
    if (!date) return;
    const formattedDate = dayjs(date).format('DD MMM');
    setSelectedDate(formattedDate);

    // scroll otomatis ke tanggal yang dipilih (opsional)
    const el = document.getElementById(`date-${dayjs(date).format('YYYY-MM-DD')}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  return (
    <>
      <MainHeader backHref="/" title="Booking Court" withLogo={false} withCartBadge />

      <main className="mt-24 mb-[31%] w-full md:mt-14">
        <div className="sticky z-30 bg-white border-b pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center px-2 pl-4">
              <DatePickerModal onChange={handleSelectDate} label="Select Booking Date">
                <DatePickerModalTrigger>
                  <Button variant="light" size={'icon-lg'} className="p-2">
                    <IconCalendarFilled className="text-primary size-6" />
                  </Button>
                </DatePickerModalTrigger>
              </DatePickerModal>
            </div>

            <Separator orientation="vertical" className="h-10" />

            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
              {dateList.map((d) => (
                <button
                  id={`date-${d.fullDate}`}
                  key={d.fullDate}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-14 h-14 rounded px-2 py-1 font-semibold transition-colors",
                    selectedDate === d.date
                      ? "bg-primary text-white"
                      : "hover:bg-muted text-black"
                  )}
                  onClick={() => setSelectedDate(d.date)}
                >
                  <span className="text-xs font-normal">{d.label}</span>
                  <div className="flex mt-0.5">
                    <span className="text-sm font-semibold me-0.5">{dayjs(d.fullDate).format('DD')}</span>
                    <span className="text-sm font-semibold">{dayjs(d.fullDate).format('MMM')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll area for table only */}
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full border border-gray-200 rounded-lg text-center border-collapse">
            <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
              <tr>
                <th className="sticky left-0 z-30 border-r border-b bg-gray-50 px-2 py-2 text-left font-semibold w-20"></th>
                {mockCourts.map((court) => (
                  <th
                    key={court.name}
                    className="border border-gray-200 px-4 py-2 text-xs font-semibold bg-gray-50"
                  >
                    <Button
                      variant={'ghost'}
                      className="flex items-center gap-1 text-gray-700"
                      onClick={() => setSelectedCourt(court)}
                    >
                      {court.name}
                      <IconInfoCircle className="inline-block size-4" />
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {mockTimes.map((time) => (
                <tr key={time}>
                  <td className="sticky left-0 z-10 border border-gray-200 bg-white px-4 py-2 text-left text-sm font-medium w-20">
                    {time}
                  </td>
                  {mockCourts.map((court) => {
                    const booked = isBooked(selectedDate, court.name, time);
                    const selected = selectedCell.some(
                      (cell) => cell.court === court.name && cell.time === time
                    );
                    return (
                      <td key={court.name} className="border border-gray-200 p-1">
                        <button
                          disabled={booked}
                          className={cn(
                            `flex h-14 w-full flex-col items-start justify-between rounded px-2 py-1 text-base font-semibold transition-all`,
                            booked
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : selected
                                ? 'border-primary bg-primary text-white shadow-lg'
                                : 'bg-white hover:bg-green-100'
                          )}
                          onClick={() => {
                            if (selected) {
                              setSelectedCell(
                                selectedCell.filter(
                                  (cell) => !(cell.court === court.name && cell.time === time)
                                )
                              );
                            } else {
                              setSelectedCell([...selectedCell, { court: court.name, time }]);
                            }
                          }}
                        >
                          <span className="text-sm">
                            {mockPrices.toLocaleString('id-ID')}
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

      {/* Court Detail Modal */}
      <Dialog open={!!selectedCourt} onOpenChange={() => setSelectedCourt(null)}>
        <DialogContent className="max-w-sm">
          {selectedCourt && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCourt.name}</DialogTitle>
              </DialogHeader>
              <div className="mt-1">
                <Image
                  src={selectedCourt.image}
                  alt={selectedCourt.name}
                  width={600}
                  height={400}
                  className="rounded-sm object-cover w-full"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNavigationWrapper className="pb-4">
        <header className="flex-between my-2 items-end">
          <div>
            <span className="text-muted-foreground text-xs">Subtotal</span>
            <h2 className="text-lg font-semibold">
              Rp {(mockPrices * selectedCell.length).toLocaleString('id-ID')}
            </h2>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">
              {selectedCell.length} Slot Terpilih
            </span>
          </div>
        </header>
        <main>
          <Button className="w-full" size={'xl'}>
            Pilih Jadwal
          </Button>
        </main>
      </BottomNavigationWrapper>
    </>
  );
};

export default BookingPage;
