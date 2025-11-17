'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNotificationMutation } from '@/mutations/admin/notification';
import type {
  CreateNotificationPayload,
  NotificationAudience,
  NotificationType
} from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconSend } from '@tabler/icons-react';
import { type SubmitHandler, useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';

const notificationSchema = z.object({
  audience: z.enum(['USER', 'ADMIN', 'ALL']),
  type: z.enum([
    'ADMIN_PUSH',
    'BOOKING_CREATED',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'MEMBERSHIP_ACTIVATED',
    'SYSTEM'
  ]),
  userId: z.string().optional(),
  title: z.string().min(1, 'Judul wajib diisi'),
  message: z.string().optional(),
  dataJson: z.string().optional()
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function PushNotificationForm() {
  const { mutate: createNotification, isPending } = useCreateNotificationMutation();

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      audience: 'ALL',
      type: 'ADMIN_PUSH',
      title: '',
      message: '',
      userId: '',
      dataJson: ''
    }
  });

  const onSubmit: SubmitHandler<NotificationFormValues> = (values) => {
    const payload: CreateNotificationPayload = {
      title: values.title,
      audience: values.audience as NotificationAudience,
      type: values.type as NotificationType
    };

    // Add optional fields
    if (values.message) payload.message = values.message;
    if (values.userId && values.audience === 'USER') payload.userId = values.userId;

    // Parse JSON data if provided
    if (values.dataJson) {
      try {
        payload.data = JSON.parse(values.dataJson);
      } catch {
        form.setError('dataJson', { message: 'Format JSON tidak valid' });
        return;
      }
    }

    createNotification(payload, {
      onSuccess: () => {
        form.reset();
      }
    });
  };

  const isSaving = isPending || form.formState.isSubmitting;
  const audienceValue = useWatch({ control: form.control, name: 'audience' });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldSet>
        <FieldGroup>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Audience */}
            <Field>
              <FieldLabel htmlFor="audience">Target Audience</FieldLabel>
              <Controller
                name="audience"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User (Pelanggan)</SelectItem>
                      <SelectItem value="ADMIN">Admin/Staff</SelectItem>
                      <SelectItem value="ALL">Semua (Broadcast)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-muted-foreground text-sm">
                Pilih siapa yang akan menerima notifikasi
              </p>
              <FieldError>{form.formState.errors.audience?.message}</FieldError>
            </Field>

            {/* Type */}
            <Field>
              <FieldLabel htmlFor="type">Tipe Notifikasi</FieldLabel>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN_PUSH">Admin Push</SelectItem>
                      <SelectItem value="BOOKING_CREATED">Booking Created</SelectItem>
                      <SelectItem value="PAYMENT_SUCCESS">Payment Success</SelectItem>
                      <SelectItem value="PAYMENT_FAILED">Payment Failed</SelectItem>
                      <SelectItem value="MEMBERSHIP_ACTIVATED">Membership Activated</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-muted-foreground text-sm">Kategori notifikasi</p>
              <FieldError>{form.formState.errors.type?.message}</FieldError>
            </Field>
          </div>

          {/* Conditional User ID field */}
          {audienceValue === 'USER' && (
            <Field>
              <FieldLabel htmlFor="userId">User ID</FieldLabel>
              <Input id="userId" {...form.register('userId')} placeholder="Masukkan User ID" />
              <p className="text-muted-foreground text-sm">
                ID user yang akan menerima notifikasi (khusus audience USER)
              </p>
              <FieldError>{form.formState.errors.userId?.message}</FieldError>
            </Field>
          )}

          {/* Title */}
          <Field>
            <FieldLabel htmlFor="title">Judul Notifikasi *</FieldLabel>
            <Input id="title" {...form.register('title')} placeholder="Masukkan judul notifikasi" />
            <FieldError>{form.formState.errors.title?.message}</FieldError>
          </Field>

          {/* Message */}
          <Field>
            <FieldLabel htmlFor="message">Pesan</FieldLabel>
            <Textarea
              id="message"
              {...form.register('message')}
              placeholder="Masukkan pesan notifikasi (opsional)"
              rows={4}
            />
            <p className="text-muted-foreground text-sm">Isi pesan notifikasi (opsional)</p>
            <FieldError>{form.formState.errors.message?.message}</FieldError>
          </Field>

          {/* Data JSON */}
          <Field>
            <FieldLabel htmlFor="dataJson">Data JSON</FieldLabel>
            <Textarea
              id="dataJson"
              {...form.register('dataJson')}
              placeholder='{"key": "value"}'
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-sm">
              Data tambahan dalam format JSON (opsional). Contoh:{' '}
              {`{"bookingId": "123", "amount": 50000}`}
            </p>
            <FieldError>{form.formState.errors.dataJson?.message}</FieldError>
          </Field>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span>
                  Mengirim...
                </>
              ) : (
                <>
                  <IconSend className="mr-2 h-4 w-4" />
                  Kirim Notifikasi
                </>
              )}
            </Button>
          </div>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
