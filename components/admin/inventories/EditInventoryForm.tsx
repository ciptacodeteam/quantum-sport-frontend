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
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().optional(),
  sport: z.enum(['PADEL', 'TENNIS']),
  quantity: z.number().min(1, { message: 'Quantity must be at least 1.' }),
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
      sport: data?.sport || 'PADEL',
      quantity: data?.quantity || 1,
      isActive: data?.isActive
    }
  });

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
