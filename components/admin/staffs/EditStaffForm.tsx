'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import DatePickerInput from '@/components/ui/date-picker-input';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ROLE, ROLE_OPTIONS } from '@/lib/constants';
import { cn, formatPhone, getPlaceholderImageUrl } from '@/lib/utils';
import { adminUpdateStaffMutationOptions } from '@/mutations/admin/staff';
import { adminStaffQueryOptions } from '@/queries/admin/staff';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z
  .object({
    image: z.file().optional(),
    name: z.string().min(1, { message: 'Nama wajib diisi' }),
    email: z.string().email({ message: 'Email tidak valid' }),
    role: z.enum([ROLE.ADMIN, ROLE.ADMIN_VIEWER, ROLE.BALLBOY, ROLE.COACH, ROLE.CASHIER], {
      message: 'Role tidak valid'
    }),
    coachType: z.string().optional(),
    phone: z
      .string()
      .min(10, { message: 'Nomor telepon minimal 10 digit' })
      .max(15, { message: 'Nomor telepon maksimal 15 digit' }),
    joinedAt: z.date().optional(),
    isActive: z.boolean().optional()
  })
  .refine(
    (data) => {
      if (data.role === ROLE.COACH) {
        return !!data.coachType;
      }
      return true;
    },
    {
      message: 'Coach type wajib diisi untuk role Coach',
      path: ['coachType']
    }
  );

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  staffId: string;
};

const EditStaffForm = ({ staffId }: Props) => {
  const { data, refetch } = useSuspenseQuery(adminStaffQueryOptions(staffId));

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      email: data?.email || '',
      role: data?.role,
      coachType: data?.coachTypeId || undefined,
      phone: data?.phone ? formatPhone(data.phone).replace(/^\+62/, '') : '',
      image: undefined,
      joinedAt: data?.joinedAt ? new Date(data.joinedAt) : undefined,
      isActive: data?.isActive
    },
    mode: 'onChange'
  });

  const selectedRole = form.watch('role');

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  const router = useRouter();

  const { mutate, isPending } = useMutation(
    adminUpdateStaffMutationOptions({
      onSuccess: () => {
        setImagePreview(null);
        refetch();
        router.refresh();
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
      id: staffId,
      data: {
        ...formData,
        phone: formatPhone(formData.phone),
        isActive: formData.isActive ? 1 : 0
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <div className="mb-2 flex items-center justify-center gap-6">
            <Avatar className="border-muted h-32 w-32 border">
              <AvatarImage
                src={
                  typeof imagePreview === 'string'
                    ? imagePreview
                    : getPlaceholderImageUrl({
                        width: 128,
                        height: 128,
                        text: 'A'
                      })
                }
                alt={"user's profile image"}
              />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>

            <Field>
              <FieldLabel htmlFor="image">Foto</FieldLabel>
              <Controller
                control={form.control}
                name="image"
                render={({ field }) => (
                  <Input
                    id="image"
                    type="file"
                    className={cn('max-w-sm')}
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
              <FieldDescription>
                Maksimal ukuran file 2MB. Format yang didukung: JPG, PNG.
              </FieldDescription>
              <FieldError>{form.formState.errors.image?.message}</FieldError>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
            <Input id="name" type="text" {...form.register('name')} placeholder="e.g. John Doe" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="text"
              {...form.register('email')}
              placeholder="e.g. john.doe@example.com"
            />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">No. Telepon</FieldLabel>
            <InputGroup>
              <InputGroupText className="px-3">+62</InputGroupText>
              <Input
                id="phone"
                type="tel"
                {...form.register('phone')}
                placeholder="e.g. 81234567890"
                onBlur={(e) => {
                  const val = e.target.value ?? '';
                  if (val.startsWith('0')) {
                    const newVal = val.replace(/^0/, '');
                    e.currentTarget.value = newVal;
                    form.setValue('phone', newVal, { shouldDirty: true, shouldTouch: true });
                  }
                }}
                onBeforeInput={(e) => {
                  const char = e.data;
                  if (char && !/[\d\s]/.test(char)) {
                    e.preventDefault();
                  }
                }}
              />
            </InputGroup>
            <FieldError>{form.formState.errors.phone?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="role">Role</FieldLabel>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== ROLE.COACH) {
                      form.setValue('coachType', undefined);
                    }
                  }}
                  value={field.value}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLE_OPTIONS.filter((option) => option.value !== ROLE.USER).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{form.formState.errors.role?.message}</FieldError>
          </Field>
          {selectedRole === ROLE.COACH && (
            <Field>
              <FieldLabel htmlFor="coachType">Coach Type</FieldLabel>
              <Controller
                control={form.control}
                name="coachType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select coach type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="GUIDED_MATCH">Guided Match</SelectItem>
                        <SelectItem value="COACH">Coach</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{form.formState.errors.coachType?.message}</FieldError>
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="joinedAt">Tanggal Bergabung</FieldLabel>
            <Controller
              control={form.control}
              name="joinedAt"
              render={({ field }) => (
                <DatePickerInput value={field.value} onValueChange={field.onChange} />
              )}
            />
            <FieldError>{form.formState.errors.joinedAt?.message}</FieldError>
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
          <Field className="mt-2">
            <Button type="submit" className="w-fit!" loading={isPending}>
              Save
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default EditStaffForm;
