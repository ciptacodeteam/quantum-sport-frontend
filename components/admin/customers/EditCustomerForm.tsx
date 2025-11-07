'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { cn, formatPhone, getPlaceholderImageUrl } from '@/lib/utils';
import { adminUpdateCustomerMutationOptions } from '@/mutations/admin/customer';
import { adminCustomerQueryOptions } from '@/queries/admin/customer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z
    .string()
    .min(3, 'Nama harus memiliki setidaknya 3 karakter')
    .max(100, 'Nama tidak boleh lebih dari 100 karakter'),
  email: z.string().email('Email tidak valid').max(100).optional().or(z.literal('')),
  phone: z
    .string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .max(15, 'Nomor telepon maksimal 15 digit'),
  image: z.file().optional()
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  customerId: string;
};

const EditCustomerForm = ({ customerId }: Props) => {
  const { data, refetch } = useSuspenseQuery(adminCustomerQueryOptions(customerId));

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      email: data?.email || '',
      phone: data?.phone ? formatPhone(data.phone).replace(/^\+62/, '') : '',
      image: undefined
    },
    mode: 'onChange'
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  const router = useRouter();

  const { mutate, isPending } = useMutation(
    adminUpdateCustomerMutationOptions({
      onSuccess: () => {
        setImagePreview(null);
        refetch();
        router.refresh();
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
      id: customerId,
      data: {
        ...formData,
        phone: formatPhone(formData.phone)
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <div className="mb-2 flex items-center justify-center gap-6">
            <Avatar className="border-muted h-32 w-32 border">
              <AvatarImage
                src={
                  typeof imagePreview === 'string'
                    ? imagePreview
                    : getPlaceholderImageUrl({
                        width: 128,
                        height: 128,
                        text: 'C'
                      })
                }
                alt="customer profile image"
              />
              <AvatarFallback>C</AvatarFallback>
            </Avatar>

            <Field>
              <FieldLabel htmlFor="image">Foto</FieldLabel>
              <Controller
                control={form.control}
                name="image"
                render={({ field }) => (
                  <Input
                    id="image"
                    type="file"
                    className={cn('max-w-sm')}
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
              <FieldDescription>
                Maksimal ukuran file 2MB. Format yang didukung: JPG, PNG.
              </FieldDescription>
              <FieldError>{form.formState.errors.image?.message}</FieldError>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
            <Input id="name" type="text" {...form.register('name')} placeholder="e.g. John Doe" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="text"
              {...form.register('email')}
              placeholder="e.g. john.doe@example.com"
            />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">No. Telepon</FieldLabel>
            <InputGroup>
              <InputGroupText className="px-3">+62</InputGroupText>
              <Input
                id="phone"
                type="tel"
                {...form.register('phone')}
                placeholder="e.g. 81234567890"
                onBlur={(e) => {
                  const val = e.target.value ?? '';
                  if (val.startsWith('0')) {
                    const newVal = val.replace(/^0/, '');
                    e.currentTarget.value = newVal;
                    form.setValue('phone', newVal, { shouldDirty: true, shouldTouch: true });
                  }
                }}
                onBeforeInput={(e) => {
                  const char = e.data;
                  if (char && !/[\d\s]/.test(char)) {
                    e.preventDefault();
                  }
                }}
              />
            </InputGroup>
            <FieldError>{form.formState.errors.phone?.message}</FieldError>
          </Field>
          <Field className="mt-2">
            <Button type="submit" className="w-fit!" loading={isPending}>
              Save
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default EditCustomerForm;
