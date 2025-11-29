'use client';

import { Button } from '@/components/ui/button';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { adminCreateBookingMutationOptions } from '@/mutations/admin/booking';
import { courtsWithSlotsQueryOptions } from '@/queries/court';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
  SectionDescription
} from '@/components/ui/section';

type SelectedSlot = {
  courtId: string;
  slotId: string;
  time: string;
  price: number;
};

const CreateBookingPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

  // Fetch courts with slots for selected date (using same endpoint as user view)
  const { data: courtsData } = useQuery(courtsWithSlotsQueryOptions(selectedDate));

  const courts = courtsData?.courts || [];
  const slots = courtsData?.slots || [];

  // Format slots for BookingCalendar component
  const slotsData = slots.length > 0 ? [{
    date: selectedDate,
    slots: slots
  }] : [];

  const { mutate: createBooking, isPending } = useMutation(
    adminCreateBookingMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'schedule'] });
        toast.success('Pemesanan berhasil dibuat!');
        router.push('/admin/kelola-pemesanan/lapangan');
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
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Tambah Pemesanan Baru" />
          <SectionDescription description="Pilih jadwal untuk membuat pemesanan baru." />
        </SectionHeader>
        <SectionContent>
          <div className="space-y-4">
            <div className="mt-4 -mx-4 sm:mx-0">
              <BookingCalendar
                courts={courts}
                slots={slotsData}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedSlots={selectedSlots}
                onSlotSelect={setSelectedSlots}
                isAdmin={true}
              />
            </div>

            {selectedSlots.length > 0 && (
              <div className="sticky bottom-0 z-10 bg-white border-t p-4 mt-4 shadow-lg -mx-4 sm:mx-0 rounded-t-lg">
                <div className="flex justify-between items-end mb-4">
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
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/admin/kelola-pemesanan/lapangan')}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleBooking}
                    loading={isPending}
                    disabled={selectedSlots.length === 0}
                    className="flex-1"
                  >
                    Simpan ({selectedSlots.length} slot)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SectionContent>
      </Section>
    </main>
  );
};

export default CreateBookingPage;
