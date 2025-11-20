'use client';

import { Button } from '@/components/ui/button';
import DatePickerInput from '@/components/ui/date-picker-input';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import MultiSelectInput from '@/components/ui/multi-select-input';
import { NumberInput } from '@/components/ui/number-input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { hoursInDay } from '@/lib/constants';
import { adminUpdateCourtCostMutationOptions } from '@/mutations/admin/court';
import { adminCourtCostingQueryOptionsById } from '@/queries/admin/court';
import type { CourtCostSchedule } from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export const formSchema = z.object({
  date: z.date(),
  happyHourPrice: z.number().min(0),
  peakHourPrice: z.number().min(0),
  closedHours: z.array(z.number()).optional(),
  isAvailable: z.boolean().optional()
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  data: CourtCostSchedule;
};

const EditCourtCostForm = ({ data }: Props) => {
  const { closeDialog } = useDialog();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: dayjs(data.startAt).toDate(),
      happyHourPrice: data.price,
      peakHourPrice: data.price,
      closedHours: [],
      isAvailable: data.isAvailable
    }
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdateCourtCostMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: adminCourtCostingQueryOptionsById(data.courtId).queryKey
        });
        form.reset();
        closeDialog(`edit-court-costing-${data.id}`);
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
    mutate({
      id: data.id,
      data: {
        ...formData,
        date: dayjs(formData.date).startOf('day').format('YYYY-MM-DD')
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="happyHourPrice">Happy Hour Price</FieldLabel>
              <Controller
                control={form.control}
                name="happyHourPrice"
                render={({ field }) => (
                  <NumberInput
                    id="happyHourPrice"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="Rp "
                    min={0}
                    allowNegative={false}
                    placeholder="e.g. Rp 100.000"
                    value={field.value}
                    onValueChange={field.onChange}
                    withControl={false}
                  />
                )}
              />
              <FieldError>{form.formState.errors.happyHourPrice?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="peakHourPrice">Peak Hour Price</FieldLabel>
              <Controller
                control={form.control}
                name="peakHourPrice"
                render={({ field }) => (
                  <NumberInput
                    id="peakHourPrice"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="Rp "
                    min={0}
                    allowNegative={false}
                    placeholder="e.g. Rp 200.000"
                    value={field.value}
                    onValueChange={field.onChange}
                    withControl={false}
                  />
                )}
              />
              <FieldError>{form.formState.errors.peakHourPrice?.message}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="date">Tanggal Berlaku</FieldLabel>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <DatePickerInput value={field.value} onValueChange={field.onChange} />
              )}
            />
            <FieldError>{form.formState.errors.date?.message}</FieldError>
          </Field>
          <Field>
            <div className="inline-flex gap-2">
              <FieldLabel htmlFor="closedHours">Jam Tutup (Opsional)</FieldLabel>
              <Tooltip>
                <TooltipTrigger>
                  <IconInfoCircle className="text-muted-foreground size-4 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    Pilih jam tutup jika lapangan tidak tersedia pada jam-jam tertentu di hari-hari
                    yang dipilih.
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
            <Controller
              control={form.control}
              name="closedHours"
              render={({ field }) => (
                <MultiSelectInput
                  options={hoursInDay.map((hour) => ({
                    label: hour.label,
                    value: hour.value.toString()
                  }))}
                  value={
                    field.value && field.value.length > 0
                      ? hoursInDay
                          .filter((hour) => field.value!.includes(hour.value))
                          .map((hour) => ({
                            label: hour.label,
                            value: hour.value.toString()
                          }))
                      : []
                  }
                  onChange={(selectedOptions) =>
                    field.onChange(selectedOptions.map((option) => parseInt(option.value)))
                  }
                  placeholder="Pilih jam tutup"
                  emptyIndicator="Tidak ada jam tersedia"
                />
              )}
            />
            <FieldError>{form.formState.errors.closedHours?.message}</FieldError>
          </Field>
          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => closeDialog(`edit-court-costing-${data.id}`)}
              >
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
export default EditCourtCostForm;
