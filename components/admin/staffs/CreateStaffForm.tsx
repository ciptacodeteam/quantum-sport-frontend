'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

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
import { PasswordInput } from '@/components/ui/password-input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ROLE, ROLE_OPTIONS } from '@/lib/constants';
import { formatPhone, getNameInitial } from '@/lib/utils';
import { adminCreateStaffMutationOptions } from '@/mutations/admin/staff';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { adminStaffsQueryOptions } from '@/queries/admin/staff';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z
  .object({
    image: z
      .file()
      .max(2 * 1024 * 1024, 'Ukuran foto maksimal 2 MB')
      .mime(['image/jpeg', 'image/png'], 'Gunakan foto JPG atau PNG')
      .optional(),
    name: z.string().min(1, { message: 'Nama wajib diisi' }),
    email: z.string().email({ message: 'Email tidak valid' }),
    role: z.enum([ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.ADMIN_VIEWER, ROLE.CASHIER], {
      message: 'Role tidak valid'
    }),
    phone: z
      .string()
      .min(10, { message: 'Nomor telepon minimal 10 digit' })
      .max(15, { message: 'Nomor telepon maksimal 15 digit' }),
    joinedAt: z.date().optional(),
    password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
    confirmPassword: z.string().min(6, { message: 'Konfirmasi password minimal 6 karakter' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password dan konfirmasi password tidak sesuai',
    path: ['confirmPassword']
  });

type FormSchema = z.infer<typeof formSchema>;

const CreateStaffForm = () => {
  const { data: currentUser } = useQuery(adminProfileQueryOptions);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: ROLE.ADMIN,
      phone: '',
      password: '',
      confirmPassword: '',
      image: undefined,
      joinedAt: new Date()
    }
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  const router = useRouter();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateStaffMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminStaffsQueryOptions.queryKey });
        form.reset();
        setImagePreview(null);
        router.push('/admin/kelola-karyawan');
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate({
      ...formData,
      phone: formatPhone(formData.phone)
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="bg-muted/20 flex flex-wrap items-center gap-4 rounded-lg border p-4 sm:col-span-2">
            <Avatar className="size-16 shrink-0 rounded-xl border">
              <AvatarImage
                src={typeof imagePreview === 'string' ? imagePreview : undefined}
                alt="Foto karyawan"
              />
              <AvatarFallback className="bg-muted text-muted-foreground rounded-xl text-lg">
                {getNameInitial(form.watch('name') || 'K')}
              </AvatarFallback>
            </Avatar>

            <Field className="min-w-0 flex-1 basis-56">
              <FieldLabel htmlFor="image">Foto</FieldLabel>
              <Controller
                control={form.control}
                name="image"
                render={({ field }) => (
                  <Input
                    id="image"
                    type="file"
                    className="bg-background w-full"
                    accept="image/jpeg,image/png"
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
            <Input
              id="name"
              type="text"
              {...form.register('name')}
              placeholder="Nama lengkap karyawan"
            />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="text"
              {...form.register('email')}
              placeholder="nama@email.com"
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
                placeholder="81234567890"
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
            <FieldLabel htmlFor="role">Peran akses</FieldLabel>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Pilih peran karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLE_OPTIONS.filter(
                        (option) =>
                          option.value !== ROLE.USER &&
                          (option.value !== ROLE.SUPER_ADMIN || currentUser?.role === 'SUPER_ADMIN')
                      ).map((option) => (
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
          <div className="grid grid-cols-1 gap-5 border-t pt-5 sm:col-span-2 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                {...form.register('password')}
                placeholder="Minimal 6 karakter"
              />
              <FieldError>{form.formState.errors.password?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Konfirmasi</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                {...form.register('confirmPassword')}
                placeholder="Ulangi kata sandi"
              />
              <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
            </Field>
          </div>
          <Field className="border-t pt-4 sm:col-span-2">
            <Button type="submit" className="w-fit! rounded-lg" loading={isPending}>
              Simpan karyawan
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default CreateStaffForm;
