'use client';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog-context';
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
import { adminCreateCourtMutationOptions } from '@/mutations/admin/court';
import { adminCourtsQueryOptions } from '@/queries/admin/court';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { ImageIcon, Save, Upload } from 'lucide-react';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nama lapangan wajib diisi.' }),
  description: z.string().optional(),
  image: z.file().min(1, { message: 'File gambar kosong.' }).optional(),
  sport: z.enum(['PADEL', 'TENNIS']).default('PADEL'),
  isActive: z.boolean().default(true)
});

type FormSchema = z.infer<typeof formSchema>;
const dialogId = 'create-court';

const CreateCourtForm = ({ defaultSport = 'PADEL' }: { defaultSport?: 'PADEL' | 'TENNIS' }) => {
  const { canCreateTennis } = useAdminCourtSports();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: true,
      image: undefined,
      name: '',
      sport: defaultSport,
      description: ''
    }
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  const { closeDialog } = useDialog();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateCourtMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminCourtsQueryOptions().queryKey });
        closeDialog(dialogId);
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate(formData);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-5">
      <FieldSet
        className="grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)]"
        disabled={isPending}
      >
        <section className="bg-muted/20 min-w-0 space-y-4 rounded-xl border p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Foto Lapangan</h3>
            <p className="text-muted-foreground text-xs">
              Opsional, untuk membantu pelanggan mengenali lapangan.
            </p>
          </div>
          <Field>
            <div className="bg-muted/40 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border">
              {imagePreview ? (
                <Image
                  src={String(imagePreview)}
                  unoptimized
                  alt="Foto lapangan"
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
                      setImagePreview(null);
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
            <h3 className="text-sm font-semibold">Informasi Lapangan</h3>
            <p className="text-muted-foreground text-xs">
              Lengkapi nama, kategori, dan detail lapangan.
            </p>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nama Lapangan</FieldLabel>
              <Input id="name" {...form.register('name')} placeholder="Contoh: Padel Court 1" />
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
                      <SelectItem value="TENNIS" disabled={!canCreateTennis}>
                        Tennis (Cemara)
                      </SelectItem>
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
                placeholder="Tambahkan informasi fasilitas atau kondisi lapangan..."
              />
              <FieldError>{form.formState.errors.description?.message}</FieldError>
            </Field>
          </FieldGroup>
        </section>
      </FieldSet>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => closeDialog(dialogId)}
        >
          Batal
        </Button>
        <Button type="submit" loading={isPending}>
          <Save />
          Simpan Lapangan
        </Button>
      </div>
    </form>
  );
};
export default CreateCourtForm;
