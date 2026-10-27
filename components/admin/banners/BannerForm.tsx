'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPhoto } from '@tabler/icons-react';
import { toast } from 'sonner';
import { createBannerApi, updateBannerApi } from '@/api/admin/banner';
import { Button } from '@/components/ui/button';
import DatetimePicker from '@/components/ui/datetime-picker';
import { useDialog } from '@/components/ui/dialog-context';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { mapApiErrorsToForm } from '@/lib/api-error';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { bannerFormSchema, type BannerFormValues } from '@/lib/banner-form-schema';
import { adminBannersQueryOptions } from '@/queries/admin/banner';
import type { Banner } from '@/types/model';

export default function BannerForm({
  data,
  readOnly = false
}: {
  data?: Banner;
  readOnly?: boolean;
}) {
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema(!!data)),
    defaultValues: {
      sequence: data?.sequence ?? 1,
      isActive: data?.isActive ?? true,
      image: undefined,
      link: data?.link || '',
      startAt: data?.startAt ? new Date(data.startAt) : data ? undefined : new Date(),
      endAt: data?.endAt ? new Date(data.endAt) : undefined
    }
  });
  const [preview, setPreview] = useState<string | null>(data?.image || null);
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  const dialogId = data ? `${readOnly ? 'view' : 'edit'}-banner-${data.id}` : 'create-banner';
  const close = () => closeDialog(dialogId);
  const mutation = useMutation({
    mutationFn: (values: BannerFormValues) =>
      data
        ? updateBannerApi({ id: data.id, data: values })
        : createBannerApi({ ...values, link: values.link || undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminBannersQueryOptions.queryKey });
      toast.success(data ? 'Banner berhasil diperbarui.' : 'Banner berhasil ditambahkan.');
      close();
    },
    onError: (error) =>
      handleMutationError(error, {
        onError: (err) => mapApiErrorsToForm(form, err),
        fallbackMessage: 'Banner belum dapat disimpan.'
      })
  });

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={form.handleSubmit((values) => {
        if (!readOnly) mutation.mutate(values);
      })}
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <p className="bg-muted/20 text-muted-foreground rounded-lg border p-3 text-sm">
          Banner ini berlaku untuk semua cabang.
        </p>
        <Field>
          <FieldLabel htmlFor={`${dialogId}-image`}>Gambar banner</FieldLabel>
          <div className="bg-muted/20 relative flex aspect-[16/6] w-full items-center justify-center overflow-hidden rounded-lg border">
            {preview ? (
              <Image
                src={preview}
                alt="Pratinjau banner"
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <IconPhoto className="size-8" />
                <span className="text-sm">Pratinjau gambar banner</span>
              </div>
            )}
          </div>
          {!readOnly && (
            <>
              <Controller
                control={form.control}
                name="image"
                render={({ field }) => (
                  <Input
                    id={`${dialogId}-image`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={mutation.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      field.onChange(file);
                      if (!file) {
                        setPreview(data?.image || null);
                        return;
                      }
                      if (
                        file.size > 5 * 1024 * 1024 ||
                        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
                      ) {
                        void form.trigger('image');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setPreview(String(reader.result));
                      reader.readAsDataURL(file);
                    }}
                  />
                )}
              />
              <FieldDescription>
                JPG, PNG, atau WebP, maksimal 5 MB.
                {data ? ' Pilih gambar hanya jika ingin menggantinya.' : ''}
              </FieldDescription>
              <FieldError>{form.formState.errors.image?.message}</FieldError>
            </>
          )}
        </Field>
        <fieldset disabled={readOnly || mutation.isPending} className="min-w-0 space-y-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
            <Field>
              <FieldLabel htmlFor={`${dialogId}-link`}>
                Tautan tujuan <span className="text-muted-foreground font-normal">(opsional)</span>
              </FieldLabel>
              <Input
                id={`${dialogId}-link`}
                {...form.register('link')}
                placeholder="https://contoh.com"
              />
              <FieldError>{form.formState.errors.link?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${dialogId}-sequence`}>Urutan</FieldLabel>
              <Input
                id={`${dialogId}-sequence`}
                type="number"
                min={1}
                step={1}
                {...form.register('sequence', { valueAsNumber: true })}
              />
              <FieldError>{form.formState.errors.sequence?.message}</FieldError>
            </Field>
          </div>
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">Jadwal penayangan</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Mulai (WIB)</FieldLabel>
                <Controller
                  control={form.control}
                  name="startAt"
                  render={({ field }) => (
                    <DatetimePicker
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? undefined)}
                    />
                  )}
                />
                <FieldError>{form.formState.errors.startAt?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Selesai (opsional)</FieldLabel>
                <Controller
                  control={form.control}
                  name="endAt"
                  render={({ field }) => (
                    <DatetimePicker
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? undefined)}
                    />
                  )}
                />
                <FieldError>{form.formState.errors.endAt?.message}</FieldError>
              </Field>
            </div>
            <p className="text-muted-foreground text-sm">
              Tanpa tanggal selesai, banner tidak memiliki batas akhir penayangan.
            </p>
          </section>
          <div className="bg-muted/20 flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-1">
              <label htmlFor={`${dialogId}-active`} className="text-sm font-medium">
                Aktifkan banner
              </label>
              <p className="text-muted-foreground text-sm">
                Banner aktif ditampilkan sesuai jadwal.
              </p>
            </div>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id={`${dialogId}-active`}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </fieldset>
      </div>
      <footer className="bg-muted/20 flex shrink-0 justify-end gap-2 border-t px-5 py-4">
        <Button
          type="button"
          variant="outline"
          className="rounded-lg shadow-none"
          disabled={mutation.isPending}
          onClick={close}
        >
          {readOnly ? 'Tutup' : 'Batal'}
        </Button>
        {!readOnly && (
          <Button
            type="submit"
            className="rounded-lg"
            loading={mutation.isPending}
            aria-label="Simpan banner"
          >
            Simpan banner
          </Button>
        )}
      </footer>
    </form>
  );
}
