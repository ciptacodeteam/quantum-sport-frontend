'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Gender } from '@/lib/constants';
import { adminCreateClassMutationOptions } from '@/mutations/admin/class';
import { adminClassesQueryOptions } from '@/queries/admin/class';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }),
  description: z.string().optional(),
  content: z.string().optional(),
  organizerName: z.string().optional(),
  speakerName: z.string().optional(),
  image: z.file().optional(),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  price: z.number().min(0),
  sessions: z.number().min(1),
  capacity: z.number().min(1),
  maxBookingPax: z.number().min(1),
  gender: z.enum(Gender),
  ageMin: z.number().min(0),
  isActive: z.boolean().default(true)
});

type FormSchema = z.infer<typeof formSchema>;

const CreateClassForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      content: '',
      organizerName: '',
      speakerName: '',
      image: undefined,
      startDate: dayjs().toDate(),
      endDate: dayjs().toDate(),
      startTime: '',
      endTime: '',
      price: 0,
      sessions: 1,
      capacity: 1,
      maxBookingPax: 1,
      gender: Gender.MALE,
      ageMin: 0,
      isActive: true
    }
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateClassMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminClassesQueryOptions.queryKey });
        form.reset();
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
            <FieldLabel htmlFor="name">Nama Kelas</FieldLabel>
            <Input id="name" type="text" {...form.register('name')} placeholder="Nama kelas" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          {/* Add more fields as needed, similar to CreateBannerForm */}
        </FieldGroup>
        <Button type="submit" disabled={isPending}>
          Simpan
        </Button>
      </FieldSet>
    </form>
  );
};

export default CreateClassForm;
