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
import { adminCreatePromoCodeMutationOptions } from '@/mutations/admin/promo-code';
import { adminPromoCodesQueryOptions } from '@/queries/admin/promo-code';
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

const CreatePromoCodeForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      discountType: 'PERCENT',
      discountPercent: 10,
      discountAmount: undefined,
      startAt: dayjs().toDate(),
      endAt: undefined,
      status: 'ACTIVE',
      maxUsage: 1
    }
  });

  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  const discountType = form.watch('discountType');

  const { mutate, isPending } = useMutation(
    adminCreatePromoCodeMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminPromoCodesQueryOptions.queryKey });
        closeDialog('create-promo-code');
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
      code: formData.code,
      discountPercent: formData.discountType === 'PERCENT' ? formData.discountPercent : null,
      discountAmount: formData.discountType === 'AMOUNT' ? formData.discountAmount : null,
      startAt: formData.startAt,
      endAt: formData.endAt,
      status: formData.status,
      maxUsage: formData.maxUsage
    };

    mutate(payload);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nama Promo</FieldLabel>
            <Input id="name" {...form.register('name')} placeholder="e.g. Promo Akhir Pekan" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="code">Kode Promo</FieldLabel>
            <Input id="code" {...form.register('code')} placeholder="e.g. WEEKEND25" />
            <FieldError>{form.formState.errors.code?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel>Jenis Diskon</FieldLabel>
            <Controller
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
                placeholder="e.g. 25"
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
                placeholder="e.g. 30000"
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
                  <DatetimePicker value={field.value} onValueChange={field.onChange} />
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
                  <DatetimePicker value={field.value} onValueChange={field.onChange} />
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
                  <Select value={field.value} onValueChange={field.onChange}>
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
                placeholder="e.g. 200"
              />
              <FieldError>{form.formState.errors.maxUsage?.message}</FieldError>
            </Field>
          </div>
          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => closeDialog('create-promo-code')}
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

export default CreatePromoCodeForm;
