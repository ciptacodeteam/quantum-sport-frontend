'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { cn, getPlaceholderImageUrl } from '@/lib/utils';
import { adminUpdatePaymentMethodMutationOptions } from '@/mutations/admin/paymentMethod';
import {
  adminPaymentMethodQueryOptions,
  adminPaymentMethodsQueryOptions
} from '@/queries/admin/paymentMethod';
import type { PaymentMethod } from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
  isActive: z.boolean().optional().default(true)
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  data: PaymentMethod;
};

const EditPaymentMethodForm = ({ data }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      logo: undefined,
      isActive: data?.isActive,
      fees: data?.fees || 0,
      percentage: data?.percentage.toString() || '0',
      channel: data?.channel || ''
    }
  });

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdatePaymentMethodMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminPaymentMethodsQueryOptions.queryKey });
        queryClient.invalidateQueries({
          queryKey: adminPaymentMethodQueryOptions(data.id).queryKey
        });
        closeDialog(`edit-payment-method-${data.id}`);
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

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(data?.logo || null);

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate({
      id: data.id,
      data: {
        ...formData,
        isActive: Number(formData.isActive)
      }
    });
  };

  const isSaving = isPending || form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <div className="flex items-center justify-center gap-6">
            {imagePreview && (
              <Avatar className="border-muted h-32 w-32 border">
                <AvatarImage
                  src={
                    typeof imagePreview === 'string'
                      ? imagePreview
                      : getPlaceholderImageUrl({
                          width: 128,
                          height: 128,
                          text: 'QS'
                        })
                  }
                  alt={'placeholder'}
                />
                <AvatarFallback>QS</AvatarFallback>
              </Avatar>
            )}

            <Field>
              <FieldLabel htmlFor="logo">Logo</FieldLabel>
              <Controller
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <Input
                    id="logo"
                    type="file"
                    className={cn(imagePreview ? 'max-w-sm' : 'w-full')}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      field.onChange(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setImagePreview(null);
                      }
                    }}
                  />
                )}
              />
              <FieldDescription>Max file size 500KB.</FieldDescription>
              <FieldError>{form.formState.errors.logo?.message}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="name">Nama</FieldLabel>
            <Input id="name" {...form.register('name')} placeholder="e.g. Raket" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    placeholder="e.g. Rp 5.000"
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
                placeholder="e.g. 2.5"
              />
              <FieldError>{form.formState.errors.percentage?.message}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="channel">Channel</FieldLabel>
            <Input id="channel" {...form.register('channel')} placeholder="e.g. VA, QRIS, etc." />
            <FieldError>{form.formState.errors.channel?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="isActive">Status</FieldLabel>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field: { value, onChange } }) => (
                <div className="flex items-center gap-4">
                  <Switch id="isActive" checked={value} onCheckedChange={(v) => onChange(v)} />
                  <label
                    htmlFor="isActive"
                    className={cn('text-sm font-medium', {
                      'text-green-600': value,
                      'text-red-600': !value
                    })}
                  >
                    {value ? 'Active' : 'Inactive'}
                  </label>
                </div>
              )}
            />
            <FieldError>{form.formState.errors.isActive?.message}</FieldError>
          </Field>
          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => closeDialog(`edit-payment-method-${data.id}`)}
              >
                Batal
              </Button>
              <Button type="submit" loading={isSaving}>
                Simpan
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default EditPaymentMethodForm;
