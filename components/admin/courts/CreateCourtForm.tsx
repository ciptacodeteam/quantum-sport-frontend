'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adminCreateCourtMutationOptions } from '@/mutations/admin/court';
import { adminCourtsQueryOptions } from '@/queries/admin/court';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  description: z.string().optional(),
  image: z.file().min(1, { message: 'Image is required.' }),
  sport: z.enum(['PADEL', 'TENNIS']).default('PADEL'),
  isActive: z.boolean().default(true)
});

type FormSchema = z.infer<typeof formSchema>;

const CreateCourtForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: true,
      image: undefined,
      name: '',
      sport: 'PADEL',
      description: ''
    }
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateCourtMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminCourtsQueryOptions().queryKey });
        closeDialog('create-court');
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
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="image">Image</FieldLabel>
            {imagePreview && (
              <Image
                src={String(imagePreview)}
                alt="Preview"
                width={400}
                height={300}
                className="border-muted max-w-xs rounded-md border object-cover"
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
            <FieldLabel htmlFor="sport">Kategori</FieldLabel>
            <Controller
              control={form.control}
              name="sport"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="sport" className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PADEL">Padel</SelectItem>
                    <SelectItem value="TENNIS">Tennis</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{form.formState.errors.sport?.message}</FieldError>
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
          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => closeDialog('create-court')}>
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
export default CreateCourtForm;
