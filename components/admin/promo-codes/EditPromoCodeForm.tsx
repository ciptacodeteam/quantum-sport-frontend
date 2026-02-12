'use client';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/components/ui/datetime-picker';
import { useDialog } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { adminUpdatePromoCodeMutationOptions } from '@/mutations/admin/promo-code';
import {
  adminPromoCodeQueryOptions,
  adminPromoCodesQueryOptions
} from '@/queries/admin/promo-code';
import type { PromoCode } from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const discountTypes = [
  { label: 'Persen', value: 'PERCENT' },
  { label: 'Nominal', value: 'AMOUNT' }
] as const;

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' }
] as const;

const numberField = (schema: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, schema);

const formSchema = z
  .object({
    name: z.string().min(1, { message: 'Nama promo wajib diisi.' }),
    code: z.string().min(1, { message: 'Kode promo wajib diisi.' }),
    discountType: z.enum(['PERCENT', 'AMOUNT']),
    discountPercent: numberField(
      z.number().min(1, { message: 'Diskon persen wajib diisi.' }).max(100, {
        message: 'Diskon persen maksimal 100%.'
      })
    ).optional(),
    discountAmount: numberField(
      z.number().min(1, { message: 'Diskon nominal wajib diisi.' })
    ).optional(),
    startAt: z.date('Tanggal mulai wajib diisi.'),
    endAt: z.date().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    maxUsage: numberField(z.number().min(1, { message: 'Maksimal penggunaan wajib diisi.' }))
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'PERCENT' && !data.discountPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountPercent'],
        message: 'Diskon persen wajib diisi.'
      });
    }

    if (data.discountType === 'AMOUNT' && !data.discountAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountAmount'],
        message: 'Diskon nominal wajib diisi.'
      });
    }
  });

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  data: PromoCode;
  readOnly?: boolean;
};

const EditPromoCodeForm = ({ data, readOnly = false }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      code: data?.code || '',
      discountType: data?.discountPercent != null ? 'PERCENT' : 'AMOUNT',
      discountPercent: data?.discountPercent ?? undefined,
      discountAmount: data?.discountAmount ?? undefined,
      startAt: data?.startAt ? dayjs(data.startAt).toDate() : dayjs().toDate(),
      endAt: data?.endAt ? dayjs(data.endAt).toDate() : undefined,
      status: data?.status || 'ACTIVE',
      maxUsage: data?.maxUsage || 1
    }
  });

  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  const discountType = form.watch('discountType');

  const { mutate, isPending } = useMutation(
    adminUpdatePromoCodeMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminPromoCodesQueryOptions.queryKey });
        queryClient.invalidateQueries({ queryKey: adminPromoCodeQueryOptions(data.id).queryKey });
        closeDialog(`edit-promo-${data.id}`);
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
    const payload = {
      name: formData.name,
      discountPercent: formData.discountType === 'PERCENT' ? formData.discountPercent : null,
      discountAmount: formData.discountType === 'AMOUNT' ? formData.discountAmount : null,
      startAt: formData.startAt,
      endAt: formData.endAt,
      status: formData.status,
      maxUsage: formData.maxUsage
    };

    mutate({
      id: data.id,
      data: payload
    });
  };

  const isSaving = isPending || form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nama Promo</FieldLabel>
            <Input id="name" {...form.register('name')} disabled={readOnly} />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="code">Kode Promo</FieldLabel>
            <Input id="code" {...form.register('code')} disabled />
            <FieldError>{form.formState.errors.code?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel>Jenis Diskon</FieldLabel>
            <Controller
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis diskon" />
                  </SelectTrigger>
                  <SelectContent>
                    {discountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{form.formState.errors.discountType?.message}</FieldError>
          </Field>
          {discountType === 'PERCENT' ? (
            <Field>
              <FieldLabel htmlFor="discountPercent">Diskon Persen</FieldLabel>
              <Input
                id="discountPercent"
                type="number"
                min={1}
                max={100}
                {...form.register('discountPercent', { valueAsNumber: true })}
                disabled={readOnly}
              />
              <FieldError>{form.formState.errors.discountPercent?.message}</FieldError>
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor="discountAmount">Diskon Nominal</FieldLabel>
              <Input
                id="discountAmount"
                type="number"
                min={1}
                {...form.register('discountAmount', { valueAsNumber: true })}
                disabled={readOnly}
              />
              <FieldError>{form.formState.errors.discountAmount?.message}</FieldError>
            </Field>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="startAt">Mulai Dari</FieldLabel>
              <Controller
                control={form.control}
                name="startAt"
                render={({ field }) => (
                  <DatetimePicker
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={readOnly}
                  />
                )}
              />
              <FieldError>{form.formState.errors.startAt?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="endAt">Selesai Pada</FieldLabel>
              <Controller
                control={form.control}
                name="endAt"
                render={({ field }) => (
                  <DatetimePicker
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={readOnly}
                  />
                )}
              />
              <FieldError>{form.formState.errors.endAt?.message}</FieldError>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{form.formState.errors.status?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="maxUsage">Maksimal Penggunaan</FieldLabel>
              <Input
                id="maxUsage"
                type="number"
                min={1}
                {...form.register('maxUsage', { valueAsNumber: true })}
                disabled={readOnly}
              />
              <FieldError>{form.formState.errors.maxUsage?.message}</FieldError>
            </Field>
          </div>
          {!readOnly && (
            <Field className="mt-2 ml-auto w-fit">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => closeDialog(`edit-promo-${data.id}`)}
                >
                  Batal
                </Button>
                <Button type="submit" loading={isSaving}>
                  Simpan
                </Button>
              </div>
            </Field>
          )}
        </FieldGroup>
      </FieldSet>
    </form>
  );
};

export default EditPromoCodeForm;
