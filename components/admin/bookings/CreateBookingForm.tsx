'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { adminCreateBookingMutationOptions } from '@/mutations/admin/booking';
import { adminBookingsQueryOptions } from '@/queries/admin/booking';
import { adminCourtsQueryOptions } from '@/queries/admin/court';
import { adminCustomersQueryOptions } from '@/queries/admin/customer';
import { adminCourtsWithSlotsQueryOptions } from '@/queries/admin/court';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  userId: z.string().min(1, { message: 'Pelanggan wajib dipilih' }),
  courtId: z.string().optional()
});

const ALL_COURTS_VALUE = '__all__';

type FormSchema = z.infer<typeof formSchema>;

type SelectedSlot = {
  courtId: string;
  slotId: string;
  time: string;
  price: number;
};

const CreateBookingForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      courtId: undefined
    }
  });

  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>(ALL_COURTS_VALUE);

  const { data: courts } = useQuery(adminCourtsQueryOptions());
  const { data: customers } = useQuery(adminCustomersQueryOptions);
  
  // Fetch courts with slots for selected date
  const { data: courtsSlotsData } = useQuery(
    adminCourtsWithSlotsQueryOptions(selectedDate, selectedCourtId === ALL_COURTS_VALUE ? undefined : selectedCourtId)
  );

  const availableCourts = courtsSlotsData?.courts || courts || [];
  const slots = courtsSlotsData?.slots || [];

  // Format slots for BookingCalendar component
  const slotsData = slots.length > 0 ? [{
    date: selectedDate,
    slots: slots
  }] : [];

  const { mutate, isPending } = useMutation(
    adminCreateBookingMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
        closeDialog('create-booking');
        form.reset();
        setSelectedSlots([]);
        setSelectedDate(dayjs().format('YYYY-MM-DD'));
        setSelectedCourtId(ALL_COURTS_VALUE);
      },
      onError: (err) => {
        if (err.errors?.name === 'ZodError') {
          const fieldErrors = err.errors.fields as Record<string, string>;
          Object.entries(fieldErrors).forEach(([fieldName, message]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message
            });
          });
        }
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    if (selectedSlots.length === 0) {
      form.setError('courtId', { message: 'Pilih minimal satu slot' });
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

    mutate({
      data: {
        userId: formData.userId,
        details,
        selectedDate
      }
    });
  };

  const activeCourts = selectedCourtId && selectedCourtId !== ALL_COURTS_VALUE
    ? availableCourts.filter(c => c.id === selectedCourtId)
    : availableCourts;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="userId">Pelanggan</FieldLabel>
            <Controller
              control={form.control}
              name="userId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih pelanggan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} {customer.phone && `(${customer.phone})`}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{form.formState.errors.userId?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="courtId">Lapangan (Opsional - Kosongkan untuk melihat semua)</FieldLabel>
            <Controller
              control={form.control}
              name="courtId"
              render={({ field }) => (
                <Select 
                  onValueChange={(value) => {
                    const actualValue = value === ALL_COURTS_VALUE ? undefined : value;
                    field.onChange(actualValue);
                    setSelectedCourtId(value === ALL_COURTS_VALUE ? ALL_COURTS_VALUE : value);
                    setSelectedSlots([]);
                  }} 
                  value={field.value || ALL_COURTS_VALUE}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua lapangan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={ALL_COURTS_VALUE}>Semua Lapangan</SelectItem>
                      {courts?.map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{form.formState.errors.courtId?.message}</FieldError>
          </Field>

          {form.watch('userId') && (
            <div className="mt-4">
              <BookingCalendar
                courts={activeCourts}
                slots={slotsData}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedSlots={selectedSlots}
                onSlotSelect={setSelectedSlots}
                isAdmin={true}
                userId={form.watch('userId')}
              />
            </div>
          )}

          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => closeDialog('create-booking')}>
                Batal
              </Button>
              <Button 
                type="submit" 
                loading={isPending}
                disabled={selectedSlots.length === 0 || !form.watch('userId')}
              >
                Simpan ({selectedSlots.length} slot)
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default CreateBookingForm;
