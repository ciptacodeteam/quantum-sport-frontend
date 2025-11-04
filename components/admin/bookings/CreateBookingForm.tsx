'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import DatePickerInput from '@/components/ui/date-picker-input';
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
import { Input } from '@/components/ui/input';
import { adminCreateBookingMutationOptions } from '@/mutations/admin/booking';
import { adminBookingsQueryOptions } from '@/queries/admin/booking';
import { adminCourtsQueryOptions } from '@/queries/admin/court';
import { adminCustomersQueryOptions } from '@/queries/admin/customer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  userId: z.string().min(1, { message: 'Pelanggan wajib dipilih' }),
  courtId: z.string().min(1, { message: 'Lapangan wajib dipilih' }),
  date: z.date({ required_error: 'Tanggal wajib dipilih' }),
  startTime: z.string().min(1, { message: 'Waktu mulai wajib dipilih' }),
  endTime: z.string().min(1, { message: 'Waktu selesai wajib dipilih' })
}).refine((data) => {
  const start = dayjs(`${dayjs(data.date).format('YYYY-MM-DD')} ${data.startTime}`);
  const end = dayjs(`${dayjs(data.date).format('YYYY-MM-DD')} ${data.endTime}`);
  return end.isAfter(start);
}, {
  message: 'Waktu selesai harus setelah waktu mulai',
  path: ['endTime']
});

type FormSchema = z.infer<typeof formSchema>;

// Generate time options from 06:00 to 23:00
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    times.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return times;
};

const timeOptions = generateTimeOptions();

const CreateBookingForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      courtId: '',
      date: undefined,
      startTime: '',
      endTime: ''
    }
  });

  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();

  const { data: courts } = useQuery(adminCourtsQueryOptions);
  const { data: customers } = useQuery(adminCustomersQueryOptions);

  const { mutate, isPending } = useMutation(
    adminCreateBookingMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
        closeDialog('create-booking');
        form.reset();
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
    const startDateTime = dayjs(`${dayjs(formData.date).format('YYYY-MM-DD')} ${formData.startTime}`);
    const endDateTime = dayjs(`${dayjs(formData.date).format('YYYY-MM-DD')} ${formData.endTime}`);

    mutate({
      data: {
        userId: formData.userId,
        courtId: formData.courtId,
        startAt: startDateTime.toISOString(),
        endAt: endDateTime.toISOString()
      }
    });
  };

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
            <FieldLabel htmlFor="courtId">Lapangan</FieldLabel>
            <Controller
              control={form.control}
              name="courtId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih lapangan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
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

          <Field>
            <FieldLabel htmlFor="date">Tanggal</FieldLabel>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <DatePickerInput
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                />
              )}
            />
            <FieldError>{form.formState.errors.date?.message}</FieldError>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="startTime">Waktu Mulai</FieldLabel>
              <Controller
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih waktu mulai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{form.formState.errors.startTime?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="endTime">Waktu Selesai</FieldLabel>
              <Controller
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih waktu selesai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{form.formState.errors.endTime?.message}</FieldError>
            </Field>
          </div>

          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => closeDialog('create-booking')}>
                Batal
              </Button>
              <Button type="submit" loading={isPending}>
                Simpan
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default CreateBookingForm;

