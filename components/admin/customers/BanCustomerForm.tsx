'use client';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/components/ui/datetime-picker';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { adminBanCustomerMutationOptions } from '@/mutations/admin/customer';
import { adminCustomersQueryOptions } from '@/queries/admin/customer';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  reason: z
    .string()
    .min(1, { message: 'Alasan wajib diisi' })
    .max(500, { message: 'Alasan maksimal 500 karakter' }),
  banExpiresAt: z.date().optional()
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  customerId: string;
};

const BanCustomerForm = ({ customerId }: Props) => {
  const { closeDialog } = useDialog();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: '',
      banExpiresAt: undefined
    }
  });

  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: adminBanCustomerMutationOptions().mutationFn,
      onSuccess: () => {
        closeDialog();
      }
    },
    {
      title: 'Ban Kustomer',
      description: 'Apakah Anda yakin ingin membatasi akses kustomer ini?',
      confirmText: 'Ban',
      cancelText: 'Batal',
      destructive: true,
      toastMessages: {
        loading: 'Membatasi akses kustomer...',
        success: () => 'Data berhasil diban.',
        error: 'Gagal membatasi akses kustomer.'
      },
      invalidate: adminCustomersQueryOptions.queryKey
    }
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    confirmAndMutate({
      id: customerId,
      data: {
        reason: formData.reason,
        banExpiresAt: formData.banExpiresAt
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="reason">Alasan Pemblokiran</FieldLabel>
            <Textarea
              id="reason"
              {...form.register('reason')}
              placeholder="e.g. Melanggar aturan komunitas"
            />
            <FieldError>{form.formState.errors.reason?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="banExpiresAt">Tanggal Berakhir Pemblokiran (Opsional)</FieldLabel>
            <Controller
              control={form.control}
              name="banExpiresAt"
              render={({ field }) => (
                <DatetimePicker value={field.value} onValueChange={field.onChange} />
              )}
            />
            <FieldError>{form.formState.errors.banExpiresAt?.message}</FieldError>
          </Field>
          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => closeDialog()}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};

export default BanCustomerForm;
