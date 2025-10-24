'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { cn, formatPhone, getPlaceholderImageUrl, getTwoWordName } from '@/lib/utils';
import { adminUpdateProfileMutationOptions } from '@/mutations/admin/auth';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export const formSchema = z.object({
  name: z.string().min(3).max(100),
  phone: z.string().min(10).max(15).optional(),
  email: z.email().min(5).max(100).optional(),
  image: z.file().optional()
});

type FormSchema = z.infer<typeof formSchema>;

const AdminChangeProfileForm = () => {
  const { data: user, isPending: isUserPending } = useQuery(adminProfileQueryOptions);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      image: undefined
    },
    mode: 'onChange'
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  useEffect(() => {
    form.reset({
      name: user?.name || '',
      phone: user?.phone ? formatPhone(user.phone).replace(/^\+62/, '') : '',
      email: user?.email || '',
      image: undefined
    });

    setImagePreview(user?.image || null);
  }, [user, form]);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdateProfileMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminProfileQueryOptions.queryKey });
      },
      onError: (err) => {
        if (err.errors) {
          const fieldErrors = err.errors as z.ZodFlattenedError<FormSchema>;
          Object.entries(fieldErrors).forEach(([fieldName, error]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message: Array.isArray(error) ? error.join(', ') : String(error)
            });
          });
        }
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (data) => {
    mutate({
      ...data,
      phone: data.phone ? formatPhone(data.phone) : undefined
    });
  };

  const isSaving = isPending || form.formState.isSubmitting || isUserPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <div className="mb-2 flex items-center justify-center gap-6">
            {imagePreview && (
              <Avatar className="border-muted h-32 w-32 border">
                <AvatarImage
                  src={
                    typeof imagePreview === 'string'
                      ? imagePreview
                      : getPlaceholderImageUrl({
                          width: 128,
                          height: 128,
                          text: 'QS'
                        })
                  }
                  alt={"user's profile image"}
                />
                <AvatarFallback>{getTwoWordName(user?.name || 'QS')}</AvatarFallback>
              </Avatar>
            )}

            <Field>
              <FieldLabel htmlFor="image">Image</FieldLabel>
              <Controller
                control={form.control}
                name="image"
                render={({ field }) => (
                  <Input
                    id="image"
                    type="file"
                    className={cn(imagePreview ? 'max-w-sm' : 'w-full')}
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
              <FieldDescription>Max file size 1MB.</FieldDescription>
              <FieldError>{form.formState.errors.image?.message}</FieldError>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
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
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
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
          <Field className="mt-2">
            <Button type="submit" className="w-fit!" loading={isSaving}>
              Save Changes
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
export default AdminChangeProfileForm;
