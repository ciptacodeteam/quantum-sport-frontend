'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { createBookingMutationOptions } from '@/mutations/booking';
import { courtsWithSlotsQueryOptions } from '@/queries/court';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type SelectedSlot = {
  courtId: string;
  slotId: string;
  time: string;
  price: number;
};

const BookingPage = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

  const { data: courtsData } = useQuery(courtsWithSlotsQueryOptions(selectedDate));
  
  const courts = courtsData?.courts || [];
  const slots = courtsData?.slots || [];

  // Format slots for BookingCalendar component
  const slotsData = slots.length > 0 ? [{
    date: selectedDate,
    slots: slots
  }] : [];

  const { mutate: createBooking, isPending } = useMutation(
    createBookingMutationOptions({
      onSuccess: () => {
        toast.success('Pemesanan berhasil dibuat!');
        router.push('/bookings');
      }
    })
  );

  const handleBooking = () => {
    if (selectedSlots.length === 0) {
      toast.error('Pilih minimal satu slot');
      return;
    }

    // Group slots by court
    const slotsByCourt = selectedSlots.reduce((acc, slot) => {
      if (!acc[slot.courtId]) {
        acc[slot.courtId] = [];
      }
      acc[slot.courtId].push(slot);
      return acc;
    }, {} as Record<string, SelectedSlot[]>);

    // Create booking details
    const details = Object.entries(slotsByCourt).flatMap(([courtId, slots]) => {
      return slots.map(slot => ({
        slotId: slot.slotId,
        courtId
      }));
    });

    createBooking({
      data: {
        details,
        selectedDate
      }
    });
  };

  const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);

  return (
    <>
      <MainHeader backHref="/" title="Booking Court" withLogo={false} withCartBadge />

      <main className="mt-24 mb-32 w-full md:mt-14">
        <BookingCalendar
          courts={courts}
          slots={slotsData}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedSlots={selectedSlots}
          onSlotSelect={setSelectedSlots}
          isAdmin={false}
        />
      </main>

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
