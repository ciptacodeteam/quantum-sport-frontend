'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { formatPhone } from '@/lib/utils';
import { adminUpdateCustomerMutationOptions } from '@/mutations/admin/customer';
import { adminCustomerQueryOptions } from '@/queries/admin/customer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z
    .string()
    .min(3, 'Nama harus memiliki setidaknya 3 karakter')
    .max(100, 'Nama tidak boleh lebih dari 100 karakter'),
  phone: z
    .string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .max(15, 'Nomor telepon maksimal 15 digit')
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  customerId: string;
};

const EditCustomerForm = ({ customerId }: Props) => {
  const { data, isError, isLoading, refetch } = useQuery(adminCustomerQueryOptions(customerId));

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: ''
    },
    mode: 'onChange'
  });

  const router = useRouter();

  const { mutate, isPending } = useMutation(
    adminUpdateCustomerMutationOptions({
      onSuccess: () => {
        refetch();
        router.refresh();
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  useEffect(() => {
    if (!data) return;

    form.reset({
      name: data.name || '',
      phone: data.phone ? formatPhone(data.phone).replace(/^\+62/, '') : ''
    });
  }, [data, form]);

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate({
      id: customerId,
      data: {
        ...formData,
        phone: formatPhone(formData.phone)
      }
    });
  };

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Memuat data kustomer...</p>;
  }

  if (isError || !data) {
    return (
      <p className="text-destructive text-sm">
        Data kustomer tidak dapat dimuat. Silakan refresh halaman atau kembali ke daftar kustomer.
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
            <Input id="name" type="text" {...form.register('name')} placeholder="e.g. John Doe" />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
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
export default EditCustomerForm;
