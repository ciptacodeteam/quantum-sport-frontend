'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adminCreateInventoryMutationOptions } from '@/mutations/admin/inventory';
import { adminInventoriesQueryOptions } from '@/queries/admin/inventory';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().optional(),
  image: z.file().optional(),
  sport: z.enum(['PADEL', 'TENNIS']),
  price: z.number().min(0, { message: 'Price must be at least 0.' }),
  quantity: z.number().min(0, { message: 'Quantity must be at least 0.' })
});

type FormSchema = z.infer<typeof formSchema>;

const CreateInventoryForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      image: undefined,
      sport: 'PADEL',
      quantity: 0,
      price: 0
    }
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateInventoryMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminInventoriesQueryOptions.queryKey });
        closeDialog('create-inventory');
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
            <FieldLabel htmlFor="image">Gambar</FieldLabel>
            {imagePreview && (
              <Image
                src={String(imagePreview)}
                unoptimized
                alt="Preview inventory"
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
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
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
            <FieldError>{form.formState.errors.image?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="name">Nama</FieldLabel>
            <Input id="name" {...form.register('name')} placeholder="e.g. Raket" />
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
              placeholder="e.g. Raket padel merk Yonex"
            />
            <FieldError>{form.formState.errors.description?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="quantity">Qty</FieldLabel>
            <Input
              type="number"
              id="quantity"
              {...form.register('quantity', { valueAsNumber: true })}
              placeholder="e.g. 10"
            />
            <FieldError>{form.formState.errors.quantity?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="price">Harga</FieldLabel>
            <Controller
              control={form.control}
              name="price"
              render={({ field }) => (
                <NumberInput
                  id="price"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="Rp "
                  withControl={false}
                  min={0}
                  placeholder="e.g. Rp 100.000"
                  value={field.value as number}
                  onValueChange={field.onChange}
                />
              )}
            />
            <FieldError>{form.formState.errors.price?.message}</FieldError>
          </Field>
          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => closeDialog('create-inventory')}>
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
export default CreateInventoryForm;
