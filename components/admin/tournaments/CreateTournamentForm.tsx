'use client';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/components/ui/datetime-picker';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { adminCreateTournamentMutationOptions } from '@/mutations/admin/tournament';
import type { Tournament } from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'Nama turnamen minimal 3 karakter.' })
      .max(100, { message: 'Nama turnamen maksimal 100 karakter.' }),
    description: z.string().max(500).optional().or(z.literal('')),
    rules: z.string().max(2000).optional().or(z.literal('')),
    image: z.instanceof(File).optional(),
    startAt: z.date({ message: 'Tanggal dan waktu mulai wajib diisi.' }),
    endAt: z.date({ message: 'Tanggal dan waktu selesai wajib diisi.' }),
    maxTeams: z.number().min(2, { message: 'Minimal 2 tim diperlukan.' }),
    teamSize: z.number().min(1, { message: 'Minimal 1 pemain per tim.' }),
    entryFee: z.number().min(0, { message: 'Biaya pendaftaran minimal 0.' }),
    location: z
      .string()
      .min(3, { message: 'Lokasi minimal 3 karakter.' })
      .max(200, { message: 'Lokasi maksimal 200 karakter.' }),
    isActive: z.boolean()
  })
  .refine(
    (data) => {
      if (data.endAt && data.startAt) {
        return data.endAt >= data.startAt;
      }
      return true;
    },
    {
      message: 'Tanggal dan waktu selesai harus setelah atau sama dengan tanggal dan waktu mulai.',
      path: ['endAt']
    }
  );

type FormSchema = z.infer<typeof formSchema>;

type TournamentPayload = Omit<
  Tournament,
  'id' | 'createdAt' | 'updatedAt' | 'image' | 'startDate' | 'endDate'
> & {
  image?: File;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
};

const CreateTournamentForm = () => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      description: '',
      rules: '',
      image: undefined,
      startAt: new Date(),
      endAt: new Date(),
      maxTeams: 16,
      teamSize: 2,
      entryFee: 0,
      location: '',
      isActive: true
    }
  });

  const router = useRouter();

  const { mutate, isPending } = useMutation(
    adminCreateTournamentMutationOptions({
      onSuccess: () => {
        form.reset();
        router.push('/admin/kelola-turnamen');
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
    const payload: TournamentPayload = {
      name: formData.name,
      description:
        formData.description && formData.description.length >= 3 ? formData.description : null,
      rules: formData.rules && formData.rules.length >= 3 ? formData.rules : null,
      image: formData.image,
      startDate: dayjs(formData.startAt).format('YYYY-MM-DD'),
      endDate: dayjs(formData.endAt).format('YYYY-MM-DD'),
      startTime: dayjs(formData.startAt).format('HH:mm'),
      endTime: dayjs(formData.endAt).format('HH:mm'),
      maxTeams: formData.maxTeams || 2,
      teamSize: formData.teamSize || 1,
      entryFee: formData.entryFee || 0,
      location: formData.location,
      isActive: formData.isActive
    };

    mutate({ data: payload });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Tournament Name</FieldLabel>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="e.g. Badminton Championship 2025"
            />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description (Optional)</FieldLabel>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="e.g. Annual badminton tournament with multiple categories"
            />
            <FieldError>{form.formState.errors.description?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="rules">Rules (Optional)</FieldLabel>
            <Textarea
              id="rules"
              {...form.register('rules')}
              placeholder="e.g. Each team consists of 2 players, knockout system"
            />
            <FieldError>{form.formState.errors.rules?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="startAt">Tanggal & Waktu Mulai</FieldLabel>
            <Controller
              control={form.control}
              name="startAt"
              render={({ field }) => (
                <DatetimePicker
                  value={field.value}
                  onValueChange={(date) => field.onChange(date ?? new Date())}
                />
              )}
            />
            <FieldError>{form.formState.errors.startAt?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="endAt">Tanggal & Waktu Selesai</FieldLabel>
            <Controller
              control={form.control}
              name="endAt"
              render={({ field }) => (
                <DatetimePicker
                  value={field.value}
                  onValueChange={(date) => field.onChange(date ?? new Date())}
                />
              )}
            />
            <FieldError>{form.formState.errors.endAt?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              {...form.register('location')}
              placeholder="e.g. Central Badminton Court"
            />
            <FieldError>{form.formState.errors.location?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="maxTeams">Max Teams</FieldLabel>
            <Controller
              control={form.control}
              name="maxTeams"
              render={({ field }) => (
                <NumberInput
                  id="maxTeams"
                  thousandSeparator="."
                  decimalSeparator=","
                  withControl={false}
                  min={2}
                  placeholder="e.g. 16"
                  value={field.value}
                  onValueChange={(value) => field.onChange(value || 2)}
                />
              )}
            />
            <FieldError>{form.formState.errors.maxTeams?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="teamSize">Team Size (Players per Team)</FieldLabel>
            <Controller
              control={form.control}
              name="teamSize"
              render={({ field }) => (
                <NumberInput
                  id="teamSize"
                  thousandSeparator="."
                  decimalSeparator=","
                  withControl={false}
                  min={1}
                  placeholder="e.g. 2"
                  value={field.value}
                  onValueChange={(value) => field.onChange(value || 1)}
                />
              )}
            />
            <FieldError>{form.formState.errors.teamSize?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="entryFee">Entry Fee</FieldLabel>
            <Controller
              control={form.control}
              name="entryFee"
              render={({ field }) => (
                <NumberInput
                  id="entryFee"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="Rp "
                  withControl={false}
                  min={0}
                  placeholder="e.g. Rp 100.000"
                  value={field.value}
                  onValueChange={(value) => field.onChange(value || 0)}
                />
              )}
            />
            <FieldError>{form.formState.errors.entryFee?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="image">Tournament Image</FieldLabel>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) form.setValue('image', file);
              }}
            />
            <FieldError>{form.formState.errors.image?.message}</FieldError>
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
                onClick={() => router.push('/admin/kelola-turnamen')}
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
export default CreateTournamentForm;
