'use client';

import { Button } from '@/components/ui/button';
import { DatePickerModal, DatePickerModalTrigger } from '@/components/ui/date-picker-modal';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Court, Slot } from '@/types/model';
import { IconCalendarFilled, IconInfoCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SelectedSlot = {
  courtId: string;
  slotId: string;
  time: string;
  price: number;
};

type BookingCalendarProps = {
  courts: Court[];
  slots?: { date: string; slots: Slot[] }[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedSlots: SelectedSlot[];
  onSlotSelect: (slots: SelectedSlot[]) => void;
  isAdmin?: boolean;
  userId?: string;
};

const BookingCalendar = ({
  courts,
  slots = [],
  selectedDate,
  onDateChange,
  selectedSlots,
  onSlotSelect,
  isAdmin = false,
  userId
}: BookingCalendarProps) => {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [dateList, setDateList] = useState<
    { label: string; date: string; fullDate: string; active?: boolean }[]
  >([]);

  // Generate date list (3 months from today)
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
        active: current.isSame(today, 'day')
      });
      current = current.add(1, 'day');
    }

    setDateList(updatedDates);
  }, []);

  // Generate time slots (06:00 to 23:00)
  const timeSlots = useMemo(() => {
    const times: string[] = [];
    for (let hour = 6; hour <= 23; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return times;
  }, []);

  // Get slots for selected date
  const selectedDateSlots = useMemo(() => {
    const dateObj = slots.find((s) => s.date === selectedDate);
    const dateSlots = dateObj?.slots || [];
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Selected Date:', selectedDate);
      console.log('Slots data:', slots);
      console.log('Selected Date Slots:', dateSlots);
    }
    return dateSlots;
  }, [slots, selectedDate]);

  // Group slots by court and time
  const slotsByCourtAndTime = useMemo(() => {
    const grouped: Record<string, Record<string, Slot>> = {};

    courts.forEach((court) => {
      grouped[court.id] = {};
    });

    selectedDateSlots.forEach((slot) => {
      // Handle different date formats from API
      // API returns: "2025-01-20 08:00:00" (space-separated) or ISO format
      let startAt: Date;
      const startAtValue = slot.startAt as Date | string;
      if (startAtValue instanceof Date) {
        startAt = startAtValue;
      } else if (typeof startAtValue === 'string') {
        // Handle space-separated format: "2025-01-20 08:00:00"
        const dateStr = startAtValue.includes('T') ? startAtValue : startAtValue.replace(' ', 'T');
        startAt = new Date(dateStr);
      } else {
        startAt = new Date(startAtValue);
      }

      const time = dayjs(startAt).format('HH:mm');
      const courtId = slot.courtId;

      if (courtId && grouped[courtId]) {
        grouped[courtId][time] = slot;
      }
    });

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Slots grouped by court and time:', grouped);
    }

    return grouped;
  }, [selectedDateSlots, courts]);

  const handleSelectDate = (date: Date | null) => {
    if (!date) return;
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    const displayDate = dayjs(date).format('DD MMM');
    onDateChange(formattedDate);

    const el = document.getElementById(`date-${formattedDate}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const toggleSlot = (courtId: string, slot: Slot) => {
    // Parse slot startAt date
    let startAt: Date;
    const startAtValue = slot.startAt as Date | string;
    if (startAtValue instanceof Date) {
      startAt = startAtValue;
    } else if (typeof startAtValue === 'string') {
      const dateStr = startAtValue.includes('T') ? startAtValue : startAtValue.replace(' ', 'T');
      startAt = new Date(dateStr);
    } else {
      startAt = new Date(startAtValue);
    }

    const time = dayjs(startAt).format('HH:mm');
    const existingIndex = selectedSlots.findIndex((s) => s.courtId === courtId && s.time === time);

    if (existingIndex >= 0) {
      // Remove slot
      onSlotSelect(selectedSlots.filter((_, i) => i !== existingIndex));
    } else {
      // Add slot
      const discountPrice = slot.discountPrice || 0;
      const effectivePrice = discountPrice > 0 ? discountPrice : slot.price;
      onSlotSelect([
        ...selectedSlots,
        {
          courtId,
          slotId: slot.id,
          time,
          price: effectivePrice
        }
      ]);
    }
  };

  const getSlot = (courtId: string, time: string): Slot | undefined => {
    return slotsByCourtAndTime[courtId]?.[time];
  };

  const isSlotBooked = (courtId: string, time: string) => {
    const slot = getSlot(courtId, time);
    return slot ? !slot.isAvailable : false;
  };

  const isSlotAvailable = (courtId: string, time: string) => {
    const slot = getSlot(courtId, time);
    // A slot is available if it exists, isAvailable is true, and has a price
    return slot ? slot.isAvailable === true && slot.price > 0 : false;
  };

  const isSlotSelected = (courtId: string, time: string) => {
    return selectedSlots.some((s) => s.courtId === courtId && s.time === time);
  };

  const getSlotPrices = (courtId: string, time: string) => {
    const slot = getSlot(courtId, time);
    const normalPrice = slot?.price || 0;
    const discountPrice = slot?.discountPrice || 0;
    const effectivePrice = discountPrice > 0 ? discountPrice : normalPrice;
    return { normalPrice, discountPrice, effectivePrice };
  };

  return (
    <div className="w-full">
      {/* Fixed date header - no horizontal scroll */}
      <div className="sticky top-0 z-[5] border-b bg-white pb-2 shadow-sm">
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

          <div className="flex flex-nowrap gap-2">
            {dateList.map((d) => (
              <button
                id={`date-${d.fullDate}`}
                key={d.fullDate}
                className={cn(
                  'flex h-14 min-w-14 flex-col items-center justify-center rounded px-2 py-1 font-semibold transition-colors',
                  selectedDate === d.fullDate
                    ? 'bg-primary text-white'
                    : 'hover:bg-muted text-black'
                )}
                onClick={() => {
                  onDateChange(d.fullDate);
                  handleSelectDate(dayjs(d.fullDate).toDate());
                }}
              >
                <span className="text-xs font-normal">{d.label}</span>
                <div className="mt-0.5 flex">
                  <span className="me-0.5 text-sm font-semibold">
                    {dayjs(d.fullDate).format('DD')}
                  </span>
                  <span className="text-sm font-semibold">{dayjs(d.fullDate).format('MMM')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table with fixed left column and scrollable slots */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-center">
            {/* Fixed header row */}
            <thead className="sticky top-0 z-[4] bg-gray-50 shadow-sm">
              <tr>
                {/* Fixed left column header */}
                <th className="sticky left-0 z-[5] w-20 border-r border-b bg-gray-50 px-2 py-2 text-left font-semibold"></th>
                {/* Court headers - fixed top, scrollable horizontally */}
                {courts.map((court) => (
                  <th
                    key={court.id}
                    className="sticky top-0 min-w-[120px] border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold"
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
              {timeSlots.map((time) => (
                <tr key={time}>
                  {/* Fixed left time column */}
                  <td className="sticky left-0 z-[1] w-20 border border-gray-200 bg-white px-4 py-2 text-left text-sm font-medium">
                    {time}
                  </td>
                  {/* Scrollable slot cells */}
                  {courts.map((court) => {
                    const slot = getSlot(court.id, time);
                    const booked = isSlotBooked(court.id, time);
                    const selected = isSlotSelected(court.id, time);
                    const available = isSlotAvailable(court.id, time);
                    const { normalPrice, discountPrice, effectivePrice } = getSlotPrices(
                      court.id,
                      time
                    );

                    return (
                      <td key={court.id} className="min-w-[120px] border border-gray-200 p-1">
                        <button
                          type="button"
                          disabled={!available || booked}
                          className={cn(
                            `flex h-14 w-full flex-col items-center justify-center rounded border px-2 py-1 text-sm font-semibold transition-all`,
                            !available || booked
                              ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                              : selected
                                ? 'border-primary bg-primary border-2 text-white shadow-lg'
                                : 'cursor-pointer border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                          )}
                          onClick={() => {
                            if (slot && available && !booked) {
                              toggleSlot(court.id, slot);
                            }
                          }}
                        >
                          {available && !booked && effectivePrice > 0 && (
                            <span className="text-xs font-medium">
                              {discountPrice > 0 && discountPrice < normalPrice ? (
                                <span className="flex flex-col items-center">
                                  <span className="text-[10px] text-gray-400 line-through">
                                    Rp {normalPrice.toLocaleString('id-ID')}
                                  </span>
                                  <span>Rp {effectivePrice.toLocaleString('id-ID')}</span>
                                </span>
                              ) : (
                                <>Rp {effectivePrice.toLocaleString('id-ID')}</>
                              )}
                            </span>
                          )}
                          {booked && <span className="text-xs">Terisi</span>}
                          {!slot && <span className="text-xs text-gray-400">-</span>}
                          {slot && !available && !booked && (
                            <span className="text-xs text-gray-400">Tidak tersedia</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Court Info Dialog */}
      <Dialog open={!!selectedCourt} onOpenChange={() => setSelectedCourt(null)}>
        <DialogContent className="max-w-sm">
          {selectedCourt && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCourt.name}</DialogTitle>
              </DialogHeader>
              <div className="mt-1">
                {selectedCourt.image && (
                  <Image
                    src={selectedCourt.image}
                    alt={selectedCourt.name}
                    width={600}
                    height={400}
                    className="w-full rounded-sm object-cover"
                  />
                )}
                {selectedCourt.description && (
                  <p className="text-muted-foreground mt-2 text-sm">{selectedCourt.description}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingCalendar;
