'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { adminUpdateInventoryMutationOptions } from '@/mutations/admin/inventory';
import {
  adminInventoriesQueryOptions,
  adminInventoryQueryOptions
} from '@/queries/admin/inventory';
import type { Inventory } from '@/types/model';
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
  quantity: z.number().min(0, { message: 'Quantity must be at least 0.' }),
  isActive: z.boolean().default(true)
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  data: Inventory;
};

const EditInventoryForm = ({ data }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      description: data?.description || '',
      image: undefined,
      sport: data?.sport || 'PADEL',
      quantity: data?.quantity ?? 0,
      isActive: data?.isActive
    }
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(
    data?.image || null
  );

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdateInventoryMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminInventoriesQueryOptions.queryKey });
        queryClient.invalidateQueries({ queryKey: adminInventoryQueryOptions(data.id).queryKey });
        closeDialog(`edit-inventory-${data.id}`);
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate({
      id: data.id,
      data: formData
    });
  };

  const isSaving = isPending || form.formState.isSubmitting;

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
                      setImagePreview(data?.image || null);
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
                onClick={() => closeDialog(`edit-inventory-${data.id}`)}
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
export default EditInventoryForm;
