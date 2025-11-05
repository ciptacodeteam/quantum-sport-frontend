'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { adminUpdateCourtMutationOptions } from '@/mutations/admin/court';
import { adminCourtQueryOptions, adminCourtsQueryOptions } from '@/queries/admin/court';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
  image: z.file().optional(),
  isActive: z.boolean().default(true),
  name: z.string().min(1, { message: 'Name is required.' }),
  description: z.string().optional()
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  courtId: string;
};

const EditCourtForm = ({ courtId }: Props) => {
  const { data } = useSuspenseQuery(adminCourtQueryOptions(courtId));

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: data?.isActive || true,
      image: undefined,
      name: data?.name || '',
      description: data?.description || ''
    },
    mode: 'onChange'
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(
    data?.image || null
  );

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdateCourtMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminCourtsQueryOptions().queryKey });
        closeDialog(`edit-court-${courtId}`);
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
    if (!courtId) return toast.error('Maaf, data tidak lengkap. Silahkan refresh dan coba lagi!');

    mutate({
      id: courtId,
      data: formData
    });
  };

  const isSaving = isPending || form.formState.isSubmitting;

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
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" {...form.register('name')} placeholder="e.g. Lapangan A" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Keterangan</FieldLabel>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="e.g. Ukuran 20x40, dalam kondisi baik"
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
                onClick={() => closeDialog(`edit-court-${courtId}`)}
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
export default EditCourtForm;
