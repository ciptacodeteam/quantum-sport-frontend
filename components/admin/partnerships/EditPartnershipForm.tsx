'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { adminUpdatePartnershipMutationOptions } from '@/mutations/admin/partnership';
import { adminPartnershipsQueryOptions } from '@/queries/admin/partnership';
import type { Partnership } from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi.' }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  logo: z.file().min(1, { message: 'Logo wajib diunggah.' })
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  data: Partnership;
};

const EditPartnershipForm = ({ data }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      description: data?.description || '',
      isActive: data?.isActive,
      logo: undefined
    }
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(data?.logo || null);

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdatePartnershipMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminPartnershipsQueryOptions.queryKey });
        closeDialog(`edit-partnership-${data.id}`);
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
        isActive: formData.isActive ? 1 : 0
      }
    });
  };
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="logo">Logo</FieldLabel>
            {imagePreview && (
              <Image
                src={String(imagePreview)}
                unoptimized
                alt="Preview"
                width={200}
                height={200}
                className="border-muted max-h-44 max-w-[200px] rounded-md border object-contain"
              />
            )}
            <Controller
              control={form.control}
              name="logo"
              render={({ field }) => (
                <Input
                  type="file"
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
            <FieldError>{form.formState.errors.logo?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="name">Nama</FieldLabel>
            <Input id="name" {...form.register('name')} placeholder="Nama partner" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
            <Textarea
              id="description"
              rows={3}
              {...form.register('description')}
              placeholder="Deskripsi"
            />
            <FieldError>{form.formState.errors.description?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="isActive">Status</FieldLabel>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field: { value, onChange } }) => (
                <div className="flex items-center gap-4">
                  <Switch id="isActive" checked={!!value} onCheckedChange={(v) => onChange(v)} />
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
                onClick={() => closeDialog(`edit-partnership-${data.id}`)}
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
export default EditPartnershipForm;
