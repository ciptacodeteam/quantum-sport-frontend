'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { createBookingMutationOptions } from '@/mutations/booking';
import { courtsSlotsQueryOptions } from '@/queries/court';
import type { Court, Slot } from '@/types/model';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { IconCalendarFilled, IconInfoCircle } from '@tabler/icons-react';
import { DatePickerModal, DatePickerModalTrigger } from '@/components/ui/date-picker-modal';

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00',
  '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00'
];

type SelectedCell = {
  slotId: string;
  courtId: string;
  courtName: string;
  time: string;
  price: number;
};

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('DD MMM'));
  const [selectedCell, setSelectedCell] = useState<SelectedCell[]>([]);
  const [dateList, setDateList] = useState<
    { label: string; date: string; fullDate: string; active?: boolean }[]
  >([]);
  const [selectedCourt, setSelectedCourt] = useState<null | { id: string; name: string; image?: string | null }>(null);

  // Create booking mutation
  const { mutate: createBooking, isPending } = useMutation(createBookingMutationOptions());

  const activeDate = useMemo(() => dateList.find((item) => item.date === selectedDate), [dateList, selectedDate]);
  const selectedFullDate = activeDate?.fullDate ?? dayjs().format('YYYY-MM-DD');

  const slotQueryParams = useMemo(
    () => ({
      startAt: dayjs(selectedFullDate).startOf('day').toISOString(),
      endAt: dayjs(selectedFullDate).endOf('day').toISOString()
    }),
    [selectedFullDate]
  );

  const { data: slotsData, isLoading: isSlotsLoading } = useQuery(
    courtsSlotsQueryOptions(slotQueryParams)
  );

  const slots = useMemo(() => slotsData ?? [], [slotsData]);

  const courts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image?: string | null }>();
    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId) return;
      if (!map.has(courtId)) {
        map.set(courtId, {
          id: courtId,
          name: slot.court?.name || `Court ${map.size + 1}`,
          image: (slot.court as Court | undefined)?.image || '/assets/img/court-3.jpg'
        });
      }
    });

    if (map.size === 0) {
      return [
        {
          id: 'default-court',
          name: 'Court',
          image: '/assets/img/court-3.jpg'
        }
      ];
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [slots]);

  const slotMap = useMemo(() => {
    const map = new Map<string, Slot & { court?: Court }>();
    slots.forEach((slot) => {
      const courtId = slot.courtId || slot.court?.id;
      if (!courtId || !slot.startAt) return;
      const time = dayjs(slot.startAt).format('HH:mm');
      map.set(`${courtId}-${time}`, slot);
    });
    return map;
  }, [slots]);

  useEffect(() => {
    setSelectedCell([]);
  }, [selectedDate]);

  useEffect(() => {
    setSelectedCell((prev) => prev.filter((cell) => {
      const slot = slotMap.get(`${cell.courtId}-${cell.time}`);
      return !!slot && slot.isAvailable;
    }));
  }, [slotMap]);

  // Create selectedSlots based on selectedCell
  const selectedSlots = selectedCell.map(cell => ({
    slotId: cell.slotId,
    courtId: cell.courtId,
    court: cell.courtName,
    time: cell.time,
    price: cell.price,
    date: selectedDate
  }));

  useEffect(() => {
    const today = dayjs();
    const endDate = today.add(3, 'month');
    const updatedDates: { label: string; date: string; fullDate: string; active?: boolean }[] = [];

    let currentDate = today;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      updatedDates.push({
        label: currentDate.format('ddd'),
        date: currentDate.format('DD MMM'),
        fullDate: currentDate.format('YYYY-MM-DD'),
        active: currentDate.isSame(today, 'day')
      });
      currentDate = currentDate.add(1, 'day');
    }

    setDateList(updatedDates);
  }, []);

  const handleBooking = () => {
    if (selectedSlots.length === 0) {
      toast.error('Pilih minimal satu slot');
      return;
    }

    // Here you would typically call the booking mutation
    createBooking({
      slots: selectedSlots,
      date: selectedDate
    });
  };

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
          {isSlotsLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">Memuat slot...</div>
          )}
          <div className="overflow-x-auto h-full">
            <table className="min-w-full border border-gray-200 text-center border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                <tr>
                  <th className="sticky left-0 z-30 border-r border-b bg-gray-50 px-2 py-2 text-left font-semibold w-20"></th>
                  {courts.map((court) => (
                    <th
                      key={court.id}
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
                {timeSlots
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
                      {courts.map((court) => {
                        const slot = slotMap.get(`${court.id}-${time}`);
                        const hasSlot = !!slot;
                        const isAvailable = !!slot?.isAvailable;
                        const selected = slot ? selectedCell.some((cell) => cell.slotId === slot.id) : false;
                        return (
                          <td key={court.name} className="border border-gray-200 p-1">
                            <button
                              disabled={!hasSlot || !isAvailable}
                              className={cn(
                                `flex h-14 w-full flex-col items-start justify-between rounded px-2 py-1 text-base font-semibold transition-all`,
                                !hasSlot
                                  ? "bg-gray-100 text-muted-foreground cursor-not-allowed"
                                  : !isAvailable
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : selected
                                      ? "border-primary bg-primary text-white shadow-lg"
                                      : "bg-white hover:bg-green-100"
                              )}
                              onClick={() => {
                                if (!slot || !isAvailable) return;
                                if (selected) {
                                  setSelectedCell(selectedCell.filter((cell) => cell.slotId !== slot.id));
                                } else {
                                  setSelectedCell([
                                    ...selectedCell,
                                    {
                                      slotId: slot.id,
                                      courtId: court.id,
                                      courtName: court.name,
                                      time,
                                      price: slot.price ?? 0
                                    }
                                  ]);
                                }
                              }}
                            >
                              {hasSlot ? (
                                <>
                                  <span className="text-sm">{`Rp${(slot.price ?? 0).toLocaleString('id-ID')}`}</span>
                                  {!isAvailable && <span className="text-xs">Booked</span>}
                                </>
                              ) : (
                                <span className="text-xs">Booked</span>
                              )}
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
                src={selectedCourt.image || '/assets/img/court-3.jpg'}
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
