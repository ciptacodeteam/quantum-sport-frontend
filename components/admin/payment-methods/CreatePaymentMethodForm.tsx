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
import { cn, getPlaceholderImageUrl } from '@/lib/utils';
import { adminCreatePaymentMethodMutationOptions } from '@/mutations/admin/paymentMethod';
import { adminPaymentMethodsQueryOptions } from '@/queries/admin/paymentMethod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().optional(),
  logo: z.file(),
  fees: z.number().min(0, { message: 'Fees must be at least 0.' })
});

type FormSchema = z.infer<typeof formSchema>;

const CreatePaymentMethodForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      logo: undefined,
      fees: 0
    }
  });

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreatePaymentMethodMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminPaymentMethodsQueryOptions.queryKey });
        closeDialog('create-payment-method');
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

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate(formData);
  };

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
                  className="object-contain"
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
            <Input id="name" {...form.register('name')} placeholder="e.g. BCA Virtual Account" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
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
                  min={0}
                  allowNegative={false}
                  placeholder="e.g. Rp 5.000"
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            <FieldError>{form.formState.errors.fees?.message}</FieldError>
          </Field>
          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => closeDialog('create-payment-method')}
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
export default CreatePaymentMethodForm;
