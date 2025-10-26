'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminCreateInventoryMutationOptions } from '@/mutations/admin/inventory';
import { adminInventoriesQueryOptions } from '@/queries/admin/inventory';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().optional(),
  quantity: z.number().min(1, { message: 'Quantity must be at least 1.' })
});

type FormSchema = z.infer<typeof formSchema>;

const CreateInventoryForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      quantity: 1
    }
  });

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateInventoryMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminInventoriesQueryOptions.queryKey });
        closeDialog('create-inventory');
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
    mutate(formData);
  };

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
