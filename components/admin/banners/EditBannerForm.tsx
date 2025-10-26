'use client';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/components/ui/datetime-picker';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { adminUpdateBannerMutationOptions } from '@/mutations/admin/banner';
import { adminBannersQueryOptions } from '@/queries/admin/banner';
import type { Banner } from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  image: z.file().min(1, { message: 'Image is required.' }),
  sequence: z.number().min(1, { message: 'Sequence must be at least 1.' }).default(1),
  link: z.string().url({ message: 'Link must be a valid URL.' }).optional(),
  isActive: z.boolean().default(true),
  startAt: z.date().optional(),
  endAt: z.date().optional()
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  data: Banner;
};

const EditBannerForm = ({ data }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sequence: data?.sequence || 1,
      isActive: data?.isActive || true,
      image: undefined,
      link: data?.link || '',
      startAt: data?.startAt ? dayjs(data.startAt).toDate() : dayjs().toDate(),
      endAt: data?.endAt ? dayjs(data.endAt).toDate() : undefined
    }
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(
    data?.image || null
  );

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdateBannerMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminBannersQueryOptions.queryKey });
        closeDialog(`edit-banner-${data.id}`);
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
      data: formData
    });
  };
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="image">Image</FieldLabel>
            {imagePreview && (
              <Image
                src={String(imagePreview)}
                unoptimized
                alt="Preview"
                width={400}
                height={300}
                className="border-muted max-h-44 max-w-xs rounded-md border object-cover"
              />
            )}
            <Controller
              control={form.control}
              name="image"
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
            <FieldError>{form.formState.errors.image?.message}</FieldError>
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="link">Link</FieldLabel>
              <Input id="link" {...form.register('link')} placeholder="e.g. https://example.com" />
              <FieldError>{form.formState.errors.link?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="sequence">Urutan</FieldLabel>
              <Input
                id="sequence"
                type="number"
                {...form.register('sequence', { valueAsNumber: true })}
                placeholder="Urutan banner"
              />
              <FieldError>{form.formState.errors.sequence?.message}</FieldError>
            </Field>
          </div>
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
                onClick={() => closeDialog(`edit-banner-${data.id}`)}
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
export default EditBannerForm;
