'use client';

import { Button } from '@/components/ui/button';
import DatePickerInput from '@/components/ui/date-picker-input';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import MultiSelectInput from '@/components/ui/multi-select-input';
import { NumberInput } from '@/components/ui/number-input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { daysOfWeek, hoursInDay } from '@/lib/constants';
import { adminCreateStaffCostMutationOptions } from '@/mutations/admin/staff';
import { adminCoachCostingQueryOptions, adminStaffQueryOptions } from '@/queries/admin/staff';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  staffId: z.string(),
  fromDate: z.date(),
  toDate: z.date(),
  days: z.array(z.number().min(0).max(7)),
  happyHourPrice: z.number().min(0),
  peakHourPrice: z.number().min(0),
  closedHours: z.array(z.number()).optional()
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  staffId: string;
};

const CreateStaffCostForm = ({ staffId }: Props) => {
  const { closeDialog } = useDialog();
  const { data: staff } = useSuspenseQuery(adminStaffQueryOptions(staffId));

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      staffId: staffId,
      fromDate: dayjs().toDate(),
      toDate: dayjs().add(7, 'day').toDate(),
      days: [],
      happyHourPrice: 0,
      peakHourPrice: 0,
      closedHours: []
    }
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateStaffCostMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: adminCoachCostingQueryOptions(staffId).queryKey
        });
        queryClient.invalidateQueries({
          queryKey: adminStaffQueryOptions(staffId).queryKey
        });
        form.reset();
        closeDialog('create-staff-costing');
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
      ...formData,
      fromDate: dayjs(formData.fromDate).startOf('day').format('YYYY-MM-DD'),
      toDate: dayjs(formData.toDate).endOf('day').format('YYYY-MM-DD')
    });
  };

  const staffRoleLabel = staff?.role
    ? String(staff.role).charAt(0).toUpperCase() + String(staff.role).slice(1).toLowerCase()
    : 'Staff';

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fromDate">Mulai Dari</FieldLabel>
              <Controller
                control={form.control}
                name="fromDate"
                render={({ field }) => (
                  <DatePickerInput value={field.value} onValueChange={field.onChange} />
                )}
              />
              <FieldError>{form.formState.errors.fromDate?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="toDate">Sampai pada</FieldLabel>
              <Controller
                control={form.control}
                name="toDate"
                render={({ field }) => (
                  <DatePickerInput value={field.value} onValueChange={field.onChange} />
                )}
              />
              <FieldError>{form.formState.errors.toDate?.message}</FieldError>
            </Field>
          </div>
          <Field>
            <div className="inline-flex gap-2">
              <FieldLabel htmlFor="days">Hari Operasional</FieldLabel>
              <Tooltip>
                <TooltipTrigger>
                  <IconInfoCircle className="text-muted-foreground size-4 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    Biaya {staffRoleLabel.toLowerCase()} akan diterapkan pada hari-hari yang dipilih
                    di sini.
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
            <Controller
              control={form.control}
              name="days"
              render={({ field }) => (
                <MultiSelectInput
                  options={daysOfWeek.map((day) => ({
                    label: day.label,
                    value: day.value.toString()
                  }))}
                  value={daysOfWeek
                    .filter((day) => field.value.includes(day.value))
                    .map((day) => ({
                      label: day.label,
                      value: day.value.toString()
                    }))}
                  onChange={(selectedOptions) =>
                    field.onChange(selectedOptions.map((option) => parseInt(option.value)))
                  }
                  placeholder="Pilih hari"
                  emptyIndicator="Tidak ada hari tersedia"
                />
              )}
            />
            <FieldError>{form.formState.errors.days?.message}</FieldError>
          </Field>
          <Field>
            <div className="inline-flex gap-2">
              <FieldLabel htmlFor="closedHours">
                Jam {staffRoleLabel} Tidak Tersedia (Opsional)
              </FieldLabel>
              <Tooltip>
                <TooltipTrigger>
                  <IconInfoCircle className="text-muted-foreground size-4 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    Pilih jam tutup jika {staffRoleLabel.toLowerCase()} tidak tersedia pada jam-jam
                    tertentu di hari-hari yang dipilih.
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
                onClick={() => closeDialog('create-staff-costing')}
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

export default CreateStaffCostForm;
