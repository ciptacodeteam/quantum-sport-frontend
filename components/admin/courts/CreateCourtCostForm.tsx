'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';
import { useTariffPeriods } from '@/hooks/useTariffPeriods';
import { formatTariffHour, resolveTariffPeriod } from '@/lib/tariff-period';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import MultiSelectInput from '@/components/ui/multi-select-input';
import { NumberInput } from '@/components/ui/number-input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { daysOfWeek, hoursInDay } from '@/lib/constants';
import { adminCreateCourtCostMutationOptions } from '@/mutations/admin/court';
import { adminCourtQueryOptions } from '@/queries/admin/court';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export const formSchema = z
  .object({
    courtId: z.string(),
    months: z.number().int().min(1).max(12),
    days: z.array(z.number().int().min(1).max(7)).min(1, 'Pilih minimal satu hari.'),
    happyHourPrice: z.number().int().min(0).max(2147483647),
    happyHourDiscountPrice: z.number().int().min(0).max(2147483647),
    peakHourPrice: z.number().int().min(0).max(2147483647),
    peakHourDiscountPrice: z.number().int().min(0).max(2147483647),
    closedHours: z.array(z.number().int().min(0).max(23))
  })
  .superRefine((value, ctx) => {
    for (const band of ['happyHour', 'peakHour'] as const) {
      if (value[`${band}DiscountPrice`] > value[`${band}Price`]) {
        ctx.addIssue({
          code: 'custom',
          path: [`${band}DiscountPrice`],
          message: 'Harga diskon tidak boleh melebihi harga normal.'
        });
      }
    }
  });

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  courtId: string;
};

const CreateCourtCostForm = ({ courtId }: Props) => {
  const { closeDialog } = useDialog();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courtId: courtId,
      months: 1,
      days: [1, 2, 3, 4, 5, 6, 7],
      happyHourPrice: 0,
      happyHourDiscountPrice: 0,
      peakHourPrice: 0,
      peakHourDiscountPrice: 0,
      closedHours: []
    }
  });

  const {
    data: court,
    isPending: isCourtLoading,
    isError: isCourtError
  } = useQuery(adminCourtQueryOptions(courtId));
  const tariff = useTariffPeriods(true);
  const bands = resolveTariffPeriod(tariff.rules, undefined, court?.sport);
  useEffect(() => {
    if (court?.rollingPricing) {
      form.reset({ ...court.rollingPricing, courtId, months: court.bookingWindowMonths ?? 1 });
    }
  }, [court, courtId, form]);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateCourtCostMutationOptions({
      onSuccess: () => {
        // Invalidate all queries related to this court's costing
        queryClient.invalidateQueries({
          queryKey: ['admin', 'courts', courtId, 'costing']
        });
        // Also invalidate general court slots queries
        queryClient.invalidateQueries({
          queryKey: ['courts', 'slots']
        });
        queryClient.invalidateQueries({ queryKey: ['admin', 'courts', courtId] });
        queryClient.invalidateQueries({ queryKey: ['courts', 'booking-window'] });
        closeDialog('create-court-costing');
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate(formData);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {isCourtError && (
        <p role="alert">Pengaturan gagal dimuat. Buka kembali form untuk mencoba lagi.</p>
      )}
      <FieldSet>
        <FieldGroup>
          <div className="bg-muted/30 space-y-2 rounded-lg border p-4 text-sm">
            <p className="font-medium">Jam Tarif Cabang</p>
            {tariff.isPending ? (
              <p>Memuat jam tarif...</p>
            ) : tariff.isError ? (
              <p role="alert">
                Jam tarif gagal dimuat. Periksa pengaturan jam tarif sebelum menyimpan.
              </p>
            ) : (
              <p>
                Happy Hour {formatTariffHour(bands.happyStart)}–{formatTariffHour(bands.happyEnd)} ·
                Peak Hour {formatTariffHour(bands.peakStart)}–{formatTariffHour(bands.peakEnd)} WIB
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Aturan terjadwal mengikuti tanggal bermain. Harga tetap diatur per lapangan.
            </p>
            <Link
              href="/admin/pengaturan-jam-tarif"
              className="text-primary inline-block underline underline-offset-4"
            >
              Atur Jam Tarif
            </Link>
          </div>
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
              <FieldLabel htmlFor="happyHourDiscountPrice">Happy Hour Discount Price</FieldLabel>
              <Controller
                control={form.control}
                name="happyHourDiscountPrice"
                render={({ field }) => (
                  <NumberInput
                    id="happyHourDiscountPrice"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="Rp "
                    min={0}
                    allowNegative={false}
                    placeholder="e.g. Rp 80.000"
                    value={field.value}
                    onValueChange={field.onChange}
                    withControl={false}
                  />
                )}
              />
              <FieldError>{form.formState.errors.happyHourDiscountPrice?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="peakHourDiscountPrice">Peak Hour Discount Price</FieldLabel>
              <Controller
                control={form.control}
                name="peakHourDiscountPrice"
                render={({ field }) => (
                  <NumberInput
                    id="peakHourDiscountPrice"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="Rp "
                    min={0}
                    allowNegative={false}
                    placeholder="e.g. Rp 150.000"
                    value={field.value}
                    onValueChange={field.onChange}
                    withControl={false}
                  />
                )}
              />
              <FieldError>{form.formState.errors.peakHourDiscountPrice?.message}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="months">Buka booking sampai (bulan ke depan)</FieldLabel>
            <Controller
              control={form.control}
              name="months"
              render={({ field }) => (
                <NumberInput
                  id="months"
                  value={field.value}
                  onValueChange={field.onChange}
                  min={1}
                  max={12}
                  allowNegative={false}
                  decimalScale={0}
                />
              )}
            />
            <p className="text-muted-foreground text-sm">
              Rentang otomatis maju setiap hari mengikuti waktu Jakarta. Simpan untuk mengganti
              aturan mingguan lapangan ini. Booking yang sudah ada tetap pada jadwal semula. Aturan
              bulk rolling tetap berlaku saat durasi atau harga dasar diubah.
            </p>
            <FieldError>{form.formState.errors.months?.message}</FieldError>
          </Field>
          <Field>
            <div className="inline-flex gap-2">
              <FieldLabel htmlFor="days">Hari Operasional</FieldLabel>
              <Tooltip>
                <TooltipTrigger>
                  <IconInfoCircle className="text-muted-foreground size-4 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <span>Biaya lapangan akan diterapkan pada hari-hari yang dipilih di sini.</span>
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
                onClick={() => closeDialog('create-court-costing')}
              >
                Batal
              </Button>
              <Button
                type="submit"
                loading={isPending}
                disabled={isCourtLoading || isCourtError || tariff.isPending || tariff.isError}
              >
                Simpan
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default CreateCourtCostForm;
