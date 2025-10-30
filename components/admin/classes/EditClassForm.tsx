'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { adminUpdateClassMutationOptions } from '@/mutations/admin/class';
import { adminClassesQueryOptions } from '@/queries/admin/class';
import type { Class } from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

type Props = {
  data: Class;
};

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }),
  description: z.string().optional(),
  content: z.string().optional(),
  organizerName: z.string().optional(),
  speakerName: z.string().optional(),
  image: z.any().optional(),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  price: z.number().min(0),
  sessions: z.number().min(1),
  capacity: z.number().min(1),
  maxBookingPax: z.number().min(1),
  gender: z.number(),
  ageMin: z.number().min(0),
  isActive: z.boolean().default(true)
});

type FormSchema = z.infer<typeof formSchema>;

const EditClassForm = ({ data }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      description: data?.description || '',
      content: data?.content || '',
      organizerName: data?.organizerName || '',
      speakerName: data?.speakerName || '',
      image: undefined,
      startDate: data?.startDate ? dayjs(data.startDate).toDate() : dayjs().toDate(),
      endDate: data?.endDate ? dayjs(data.endDate).toDate() : dayjs().toDate(),
      startTime: data?.startTime || '',
      endTime: data?.endTime || '',
      price: data?.price || 0,
      sessions: data?.sessions || 1,
      capacity: data?.capacity || 1,
      maxBookingPax: data?.maxBookingPax || 1,
      gender: data?.gender || 0,
      ageMin: data?.ageMin || 0,
      isActive: data?.isActive ?? true
    }
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdateClassMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminClassesQueryOptions.queryKey });
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
    mutate({ id: data.id, data: formData });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nama Kelas</FieldLabel>
            <Input id="name" type="text" {...form.register('name')} placeholder="Nama kelas" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          {/* Add more fields as needed, similar to EditBannerForm */}
        </FieldGroup>
        <Button type="submit" disabled={isPending}>
          Simpan
        </Button>
      </FieldSet>
    </form>
  );
};

export default EditClassForm;
