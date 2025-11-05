'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { createBookingMutationOptions } from '@/mutations/booking';
import { courtsWithSlotsQueryOptions } from '@/queries/court';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  '12:00', '13:00', '14:00', '15:00', '16:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
  '23:00', '24:00'
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

  const handleBooking = () => {
    if (selectedSlots.length === 0) {
      toast.error('Pilih minimal satu slot');
      return;
    }

    setDateList(updatedDates);
  }, []);

  const handleSelectDate = (date: Date | null) => {
    if (!date) return;
    const formattedDate = dayjs(date).format('DD MMM');
    setSelectedDate(formattedDate);

    const el = document.getElementById(`date-${dayjs(date).format('YYYY-MM-DD')}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);

  return (
    <>
      <MainHeader backHref="/" title="Booking Court" withLogo={false} withCartBadge />

      {/* ⬇️ Area scroll utama dibatasi hanya di sini */}
      <main className="mt-24 w-full md:mt-14 flex flex-col h-[calc(100dvh-180px)]">
        {/* Sticky header (tanggal & tombol kalender) */}
        <div className="sticky top-24 md:top-14 z-30 bg-white border-b pb-2">
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

            {/* Scroll kanan kiri hanya untuk tanggal */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap px-2">
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

        {/* Scroll area hanya untuk tabel */}
        <div className="flex-1 overflow-auto scrollbar-hide pb-10">
          <div className="overflow-x-auto h-full">
            <table className="min-w-full border border-gray-200 text-center border-separate border-spacing-0">
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
                {mockTimes
                  .filter((time) => {
                    const now = dayjs();

                    const timeMoment = dayjs(`${dayjs().year()}-${selectedDate} ${time}`, "YYYY-DD MMM HH:mm");

                    return dayjs(selectedDate, "DD MMM").isAfter(now, "day") || timeMoment.isAfter(now);
                  })
                  .map((time) => (
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
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : selected
                                    ? "border-primary bg-primary text-white shadow-lg"
                                    : "bg-white hover:bg-green-100"
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
                              <span className="text-sm">{mockPrices.toLocaleString("id-ID")}</span>
                              {booked && <span className="text-xs">booked</span>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

              </tbody>
            </table>

            <div className="h-2 pointer-events-none"></div>
          </div>
        </div>
      </main>


      <Dialog open={!!selectedCourt} onOpenChange={() => setSelectedCourt(null)}>
        <DialogContent className="w-11/12">
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
              Rp {totalPrice.toLocaleString('id-ID')}
            </h2>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">
              {selectedSlots.length} Slot Terpilih
            </span>
          </div>
        </header>
        <main>
          <Button 
            className="w-full" 
            size={'xl'}
            onClick={handleBooking}
            disabled={selectedSlots.length === 0 || isPending}
            loading={isPending}
          >
            Pilih Jadwal
          </Button>
        </main>
      </BottomNavigationWrapper>
    </>
  );
};

export default BookingPage;
