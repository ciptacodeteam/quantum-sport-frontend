'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { adminUpdateInventoryMutationOptions } from '@/mutations/admin/inventory';
import {
  adminInventoriesQueryOptions,
  adminInventoryQueryOptions
} from '@/queries/admin/inventory';
import type { Inventory } from '@/types/model';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon, Save, Upload } from 'lucide-react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nama alat minimal 2 karakter.' }),
  description: z.string().optional(),
  image: z.file().optional(),
  sport: z.enum(['PADEL', 'TENNIS']),
  quantity: z.number().min(0, { message: 'Jumlah unit tidak boleh negatif.' }),
  isActive: z.boolean().default(true)
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  data: Inventory;
  readOnly?: boolean;
};

const EditInventoryForm = ({ data, readOnly = false }: Props) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      description: data?.description || '',
      image: undefined,
      sport: data?.sport || 'PADEL',
      quantity: data?.quantity ?? 0,
      isActive: data?.isActive
    }
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(
    data?.image || null
  );

  const { closeDialog } = useDialog();
  const dialogId = `${readOnly ? 'view' : 'edit'}-inventory-${data.id}`;

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdateInventoryMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminInventoriesQueryOptions.queryKey });
        queryClient.invalidateQueries({ queryKey: adminInventoryQueryOptions(data.id).queryKey });
        closeDialog(dialogId);
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    if (readOnly) return;
    mutate({
      id: data.id,
      data: formData
    });
  };

  const isSaving = isPending || form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-5">
      <FieldSet
        className="grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)]"
        disabled={isSaving || readOnly}
      >
        <section className="bg-muted/20 min-w-0 space-y-4 rounded-xl border p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Foto Alat</h3>
            <p className="text-muted-foreground text-xs">
              Foto untuk membantu mengenali inventori.
            </p>
          </div>
          <Field>
            <div className="bg-muted/40 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border">
              {imagePreview ? (
                <Image
                  src={String(imagePreview)}
                  unoptimized
                  alt="Foto inventori"
                  width={400}
                  height={300}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <ImageIcon className="size-8 opacity-50" />
                  <span className="text-xs">Belum ada foto</span>
                </div>
              )}
            </div>
            <Controller
              control={form.control}
              name="image"
              render={({ field }) => (
                <Input
                  id={`${dialogId}-image`}
                  className="peer sr-only"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    field.onChange(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    } else {
                      setImagePreview(data?.image || null);
                    }
                  }}
                />
              )}
            />
            <FieldLabel
              htmlFor={`${dialogId}-image`}
              className="peer-focus-visible:ring-ring hover:bg-muted/50 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm peer-focus-visible:ring-2"
            >
              <Upload className="size-4" />
              {imagePreview ? 'Ganti Foto' : 'Unggah Foto'}
            </FieldLabel>
            <p className="text-muted-foreground truncate text-xs">
              {form.watch('image')?.name || 'Pilih file gambar dari perangkat.'}
            </p>
            <FieldError>{form.formState.errors.image?.message}</FieldError>
          </Field>
        </section>
        <section className="min-w-0 space-y-5 rounded-xl border p-4">
          <div className="space-y-1 border-b pb-4">
            <h3 className="text-sm font-semibold">Informasi Alat</h3>
            <p className="text-muted-foreground text-xs">Nama, kategori, dan detail inventori.</p>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nama Alat</FieldLabel>
              <Input id="name" {...form.register('name')} placeholder="Contoh: Raket padel" />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="sport">Kategori</FieldLabel>
              <Controller
                control={form.control}
                name="sport"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="sport" className="w-full">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PADEL">Padel</SelectItem>
                      <SelectItem value="TENNIS">Tennis</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{form.formState.errors.sport?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Keterangan</FieldLabel>
              <Textarea
                id="description"
                className="min-h-24 resize-y"
                {...form.register('description')}
                placeholder="Tambahkan merek, spesifikasi, atau kondisi alat..."
              />
              <FieldError>{form.formState.errors.description?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="quantity">Jumlah Unit</FieldLabel>
              <Input
                type="number"
                min={0}
                step={1}
                id="quantity"
                {...form.register('quantity', { valueAsNumber: true })}
                placeholder="Contoh: 10"
              />
              <FieldError>{form.formState.errors.quantity?.message}</FieldError>
            </Field>
            <Field className="bg-muted/30 rounded-lg border p-4">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field: { value, onChange } }) => (
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <label
                        htmlFor="isActive"
                        className={cn(
                          'text-sm font-medium',
                          value ? 'text-green-600' : 'text-muted-foreground'
                        )}
                      >
                        {value ? 'Inventori Aktif' : 'Inventori Nonaktif'}
                      </label>
                      <p className="text-muted-foreground text-xs">
                        Atur ketersediaan alat untuk pelanggan.
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={value}
                      onCheckedChange={onChange}
                      aria-label="Status inventori"
                    />
                  </div>
                )}
              />
              <FieldError>{form.formState.errors.isActive?.message}</FieldError>
            </Field>
          </FieldGroup>
        </section>
      </FieldSet>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={() => closeDialog(dialogId)}
        >
          {readOnly ? 'Tutup' : 'Batal'}
        </Button>
        {!readOnly && (
          <Button type="submit" loading={isSaving}>
            <Save />
            Simpan Perubahan
          </Button>
        )}
      </div>
    </form>
  );
};
export default EditInventoryForm;
