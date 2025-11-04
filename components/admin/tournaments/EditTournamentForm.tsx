'use client';

import { Button } from '@/components/ui/button';
import DatePickerInput from '@/components/ui/date-picker-input';
import { useDialog } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { adminUpdateTournamentMutationOptions } from '@/mutations/admin/tournament';
import {
  adminTournamentQueryOptions,
  adminTournamentsQueryOptions
} from '@/queries/admin/tournament';
import type { Tournament } from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';
import dayjs from 'dayjs';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nama harus minimal 2 karakter.' }),
  description: z.string().optional(),
  rules: z.string().optional(),
  startDate: z.date({ required_error: 'Tanggal mulai harus diisi.' }),
  endDate: z.date({ required_error: 'Tanggal selesai harus diisi.' }),
  startTime: z.string().min(1, { message: 'Waktu mulai harus diisi.' }),
  endTime: z.string().min(1, { message: 'Waktu selesai harus diisi.' }),
  maxTeams: z.number().min(1, { message: 'Minimal 1 tim.' }),
  teamSize: z.number().min(1, { message: 'Minimal 1 pemain per tim.' }),
  entryFee: z.number().min(0, { message: 'Biaya pendaftaran minimal 0.' }),
  location: z.string().min(1, { message: 'Lokasi harus diisi.' }),
  isActive: z.boolean().optional()
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: 'Tanggal selesai harus setelah tanggal mulai.',
  path: ['endDate']
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  data: Tournament;
};

const EditTournamentForm = ({ data }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      description: data?.description || '',
      rules: data?.rules || '',
      startDate: data?.startDate ? dayjs(data.startDate).toDate() : undefined,
      endDate: data?.endDate ? dayjs(data.endDate).toDate() : undefined,
      startTime: data?.startTime || '',
      endTime: data?.endTime || '',
      maxTeams: data?.maxTeams || 16,
      teamSize: data?.teamSize || 2,
      entryFee: data?.entryFee || 0,
      location: data?.location || '',
      isActive: data?.isActive ?? true
    }
  });

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdateTournamentMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminTournamentsQueryOptions().queryKey });
        queryClient.invalidateQueries({ queryKey: adminTournamentQueryOptions(data.id).queryKey });
        closeDialog(`edit-tournament-${data.id}`);
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
      data: {
        ...formData,
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0],
        description: formData.description || null,
        rules: formData.rules || null
      }
    });
  };

  const isSaving = isPending || form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nama Turnamen</FieldLabel>
            <Input id="name" {...form.register('name')} placeholder="e.g. Turnamen Badminton 2025" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="e.g. Turnamen badminton tahunan dengan berbagai kategori"
            />
            <FieldError>{form.formState.errors.description?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="rules">Aturan</FieldLabel>
            <Textarea
              id="rules"
              {...form.register('rules')}
              placeholder="e.g. Setiap tim terdiri dari 2 pemain, sistem gugur"
            />
            <FieldError>{form.formState.errors.rules?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="startDate">Tanggal Mulai</FieldLabel>
            <Controller
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DatePickerInput
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            <FieldError>{form.formState.errors.startDate?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="endDate">Tanggal Selesai</FieldLabel>
            <Controller
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <DatePickerInput
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            <FieldError>{form.formState.errors.endDate?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="startTime">Waktu Mulai</FieldLabel>
            <Input
              id="startTime"
              type="time"
              {...form.register('startTime')}
              placeholder="HH:mm"
            />
            <FieldError>{form.formState.errors.startTime?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="endTime">Waktu Selesai</FieldLabel>
            <Input
              id="endTime"
              type="time"
              {...form.register('endTime')}
              placeholder="HH:mm"
            />
            <FieldError>{form.formState.errors.endTime?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="location">Lokasi</FieldLabel>
            <Input id="location" {...form.register('location')} placeholder="e.g. Lapangan Badminton Sentral" />
            <FieldError>{form.formState.errors.location?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="maxTeams">Maksimal Tim</FieldLabel>
            <Controller
              control={form.control}
              name="maxTeams"
              render={({ field }) => (
                <NumberInput
                  id="maxTeams"
                  thousandSeparator="."
                  decimalSeparator=","
                  withControl={false}
                  min={1}
                  placeholder="e.g. 16"
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            <FieldError>{form.formState.errors.maxTeams?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="teamSize">Jumlah Pemain per Tim</FieldLabel>
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
                  onValueChange={field.onChange}
                />
              )}
            />
            <FieldError>{form.formState.errors.teamSize?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="entryFee">Biaya Pendaftaran</FieldLabel>
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
                  onValueChange={field.onChange}
                />
              )}
            />
            <FieldError>{form.formState.errors.entryFee?.message}</FieldError>
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
                onClick={() => closeDialog(`edit-tournament-${data.id}`)}
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
export default EditTournamentForm;
