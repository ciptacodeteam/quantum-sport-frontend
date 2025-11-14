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
import { adminCreateTournamentMutationOptions } from '@/mutations/admin/tournament';
import { adminTournamentsQueryOptions } from '@/queries/admin/tournament';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z
  .object({
    name: z.string().min(3, { message: 'Name must be at least 3 characters.' }).max(100, { message: 'Name must not exceed 100 characters.' }),
    description: z.string().min(3, { message: 'Description must be at least 3 characters.' }).max(500, { message: 'Description must not exceed 500 characters.' }).optional().or(z.literal('')),
    rules: z.string().min(3, { message: 'Rules must be at least 3 characters.' }).max(2000, { message: 'Rules must not exceed 2000 characters.' }).optional().or(z.literal('')),
    image: z.instanceof(File).optional(),
    startDate: z.date(),
    endDate: z.date(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Start time must be in HH:mm format.' }),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'End time must be in HH:mm format.' }),
    maxTeams: z.number().min(2, { message: 'Minimum 2 teams required.' }),
    teamSize: z.number().min(1, { message: 'Minimum 1 player per team.' }),
    entryFee: z.number().min(0, { message: 'Entry fee must be 0 or more.' }),
    location: z.string().min(3, { message: 'Location must be at least 3 characters.' }).max(200, { message: 'Location must not exceed 200 characters.' }),
    isActive: z.boolean()
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after or equal to start date.',
      path: ['endDate']
    }
  );

type FormSchema = z.infer<typeof formSchema>;

const CreateTournamentForm = () => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      rules: '',
      image: undefined,
      startDate: new Date(),
      endDate: new Date(),
      startTime: '',
      endTime: '',
      maxTeams: 16,
      teamSize: 2,
      entryFee: 0,
      location: '',
      isActive: true
    }
  });

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateTournamentMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminTournamentsQueryOptions().queryKey });
        closeDialog('create-tournament');
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
    const payload = new FormData();
    
    payload.append('name', formData.name);
    if (formData.description && formData.description.length >= 3) {
      payload.append('description', formData.description);
    }
    if (formData.rules && formData.rules.length >= 3) {
      payload.append('rules', formData.rules);
    }
    if (formData.image) payload.append('image', formData.image);
    payload.append('startDate', formData.startDate.toISOString().split('T')[0]);
    payload.append('endDate', formData.endDate.toISOString().split('T')[0]);
    payload.append('startTime', formData.startTime);
    payload.append('endTime', formData.endTime);
    payload.append('maxTeams', (formData.maxTeams || 2).toString());
    payload.append('teamSize', (formData.teamSize || 1).toString());
    payload.append('entryFee', (formData.entryFee || 0).toString());
    payload.append('location', formData.location);
    payload.append('isActive', formData.isActive.toString());

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
            <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
            <Controller
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DatePickerInput value={field.value} onValueChange={field.onChange} />
              )}
            />
            <FieldError>{form.formState.errors.startDate?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="endDate">End Date</FieldLabel>
            <Controller
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <DatePickerInput value={field.value} onValueChange={field.onChange} />
              )}
            />
            <FieldError>{form.formState.errors.endDate?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="startTime">Start Time</FieldLabel>
            <Input id="startTime" type="time" {...form.register('startTime')} placeholder="HH:mm" />
            <FieldError>{form.formState.errors.startTime?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="endTime">End Time</FieldLabel>
            <Input id="endTime" type="time" {...form.register('endTime')} placeholder="HH:mm" />
            <FieldError>{form.formState.errors.endTime?.message}</FieldError>
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
                onClick={() => closeDialog('create-tournament')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Save
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default CreateTournamentForm;
