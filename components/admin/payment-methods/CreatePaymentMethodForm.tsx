'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { adminCreatePaymentMethodMutationOptions } from '@/mutations/admin/paymentMethod';
import { adminPaymentMethodsQueryOptions } from '@/queries/admin/paymentMethod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon, Save, Upload } from 'lucide-react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export const formSchema = z.object({
  name: z.string().min(3).max(100),
  logo: z.file().optional(),
  fees: z.coerce.number().min(0),
  percentage: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: 'Percentage must be a non-negative number' }
  ),
  channel: z.string().min(2).max(50).optional(),
  sequence: z.coerce.number().min(0),
  isActive: z.boolean().optional().default(true)
});

type FormSchema = z.infer<typeof formSchema>;

const CreatePaymentMethodForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      logo: undefined,
      fees: 0,
      percentage: '0',
      channel: '',
      sequence: 0,
      isActive: true
    }
  });

  const { closeDialog } = useDialog();
  const dialogId = 'create-payment-method';

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreatePaymentMethodMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminPaymentMethodsQueryOptions.queryKey });
        closeDialog(dialogId);
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate(formData);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-5">
      <FieldSet
        className="grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)]"
        disabled={isPending}
      >
        <section className="bg-muted/20 min-w-0 space-y-4 rounded-xl border p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Logo Pembayaran</h3>
            <p className="text-muted-foreground text-xs">
              Logo untuk membantu pelanggan mengenali metode pembayaran.
            </p>
          </div>
          <Field>
            <div className="bg-muted/40 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border">
              {imagePreview ? (
                <Image
                  src={String(imagePreview)}
                  unoptimized
                  alt="Logo metode pembayaran"
                  width={400}
                  height={300}
                  className="h-full w-full bg-white object-contain p-3"
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <ImageIcon className="size-8 opacity-50" />
                  <span className="text-xs">Belum ada logo</span>
                </div>
              )}
            </div>
            <Controller
              control={form.control}
              name="logo"
              render={({ field }) => (
                <Input
                  id={`${dialogId}-logo`}
                  className="peer sr-only"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    field.onChange(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    } else {
                      setImagePreview(null);
                    }
                  }}
                />
              )}
            />
            <FieldLabel
              htmlFor={`${dialogId}-logo`}
              className="peer-focus-visible:ring-ring hover:bg-muted/50 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm peer-focus-visible:ring-2"
            >
              <Upload className="size-4" />
              {imagePreview ? 'Ganti Logo' : 'Unggah Logo'}
            </FieldLabel>
            <p className="text-muted-foreground truncate text-xs">
              {form.watch('logo')?.name || 'Pilih file gambar dari perangkat.'}
            </p>
            <FieldError>{form.formState.errors.logo?.message}</FieldError>
          </Field>
        </section>
        <section className="min-w-0 space-y-5 rounded-xl border p-4">
          <div className="space-y-1 border-b pb-4">
            <h3 className="text-sm font-semibold">Informasi & Biaya</h3>
            <p className="text-muted-foreground text-xs">
              Identitas metode, biaya layanan, dan urutan tampilan.
            </p>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nama Metode</FieldLabel>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Contoh: BCA Virtual Account"
              />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="channel">Channel</FieldLabel>
              <Input
                id="channel"
                {...form.register('channel')}
                placeholder="BCA_VIRTUAL_ACCOUNT, QRIS, CARDS"
              />
              <FieldError>{form.formState.errors.channel?.message}</FieldError>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fees">Biaya Layanan</FieldLabel>
                <Controller
                  control={form.control}
                  name="fees"
                  render={({ field }) => (
                    <NumberInput
                      id="fees"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                      withControl={false}
                      min={0}
                      allowNegative={false}
                      placeholder="Contoh: Rp 5.000"
                      value={field.value as number}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                <FieldError>{form.formState.errors.fees?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="percentage">Persentase (%)</FieldLabel>
                <Input
                  id="percentage"
                  type="number"
                  step="any"
                  min={0}
                  {...form.register('percentage')}
                  placeholder="Contoh: 2.5"
                />
                <FieldError>{form.formState.errors.percentage?.message}</FieldError>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="sequence">Urutan Tampilan</FieldLabel>
              <Controller
                control={form.control}
                name="sequence"
                render={({ field }) => (
                  <NumberInput
                    id="sequence"
                    thousandSeparator="."
                    decimalSeparator=","
                    withControl={false}
                    min={0}
                    allowNegative={false}
                    placeholder="Contoh: 1"
                    value={field.value as number}
                    onValueChange={field.onChange}
                  />
                )}
              />
              <FieldError>{form.formState.errors.sequence?.message}</FieldError>
            </Field>
            <Field className="bg-muted/30 rounded-lg border p-4">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field: { value, onChange } }) => (
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <label
                        htmlFor="isActive"
                        className={cn(
                          'text-sm font-medium',
                          value ? 'text-green-600' : 'text-muted-foreground'
                        )}
                      >
                        {value ? 'Metode Aktif' : 'Metode Nonaktif'}
                      </label>
                      <p className="text-muted-foreground text-xs">
                        Atur ketersediaan metode untuk pelanggan.
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={value}
                      onCheckedChange={onChange}
                      aria-label="Status metode pembayaran"
                    />
                  </div>
                )}
              />
              <FieldError>{form.formState.errors.isActive?.message}</FieldError>
            </Field>
          </FieldGroup>
        </section>
      </FieldSet>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => closeDialog(dialogId)}
        >
          Batal
        </Button>
        <Button type="submit" loading={isPending}>
          <Save />
          Simpan Metode
        </Button>
      </div>
    </form>
  );
};
export default CreatePaymentMethodForm;
