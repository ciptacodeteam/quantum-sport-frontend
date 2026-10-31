'use client';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';

import { mapApiErrorsToForm } from '@/lib/api-error';

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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { adminUpdateCourtMutationOptions } from '@/mutations/admin/court';
import { adminCourtQueryOptions, adminCourtsQueryOptions } from '@/queries/admin/court';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ImageIcon, Save, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
  image: z.file().optional(),
  isActive: z.boolean().default(true),
  name: z.string().min(1, { message: 'Name is required.' }),
  sport: z.enum(['PADEL', 'TENNIS']).default('PADEL'),
  description: z.string().optional()
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  courtId: string;
};

const EditCourtForm = ({ courtId }: Props) => {
  const router = useRouter();
  const { canCreateTennis } = useAdminCourtSports();
  const { data } = useSuspenseQuery(adminCourtQueryOptions(courtId));

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: data?.isActive,
      image: undefined,
      name: data?.name || '',
      sport: data?.sport || 'PADEL',
      description: data?.description || ''
    },
    mode: 'onChange'
  });

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(
    data?.image || null
  );

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminUpdateCourtMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminCourtsQueryOptions().queryKey });
        queryClient.invalidateQueries({ queryKey: adminCourtQueryOptions(courtId).queryKey });
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    if (!courtId) return toast.error('Maaf, data tidak lengkap. Silahkan refresh dan coba lagi!');

    mutate({
      id: courtId,
      data: {
        ...formData,
        isActive: formData.isActive ? 1 : 0
      }
    });
  };

  const isSaving = isPending || form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldSet
        className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]"
        disabled={isSaving}
      >
        <div className="bg-card space-y-5 rounded-xl border p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">Foto Lapangan</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Foto untuk membantu pelanggan mengenali lapangan.
            </p>
          </div>
          <Field>
            <div className="bg-muted/40 relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border">
              {imagePreview ? (
                <Image
                  src={String(imagePreview)}
                  unoptimized
                  alt={`Foto ${data.name}`}
                  loading="lazy"
                  width={400}
                  height={300}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <ImageIcon className="size-9 opacity-50" />
                  <span className="text-sm">Belum ada foto</span>
                </div>
              )}
            </div>
            <Controller
              control={form.control}
              name="image"
              render={({ field }) => (
                <Input
                  id="image"
                  className="peer sr-only"
                  type="file"
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
                      setImagePreview(data?.image || null);
                    }
                  }}
                />
              )}
            />
            <FieldLabel
              htmlFor="image"
              className="peer-focus-visible:ring-ring hover:bg-muted/50 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm font-medium peer-focus-visible:ring-2"
            >
              <Upload className="size-4" />
              {imagePreview ? 'Ganti foto' : 'Unggah foto'}
            </FieldLabel>
            <p className="text-muted-foreground truncate text-xs">
              {form.watch('image')?.name || 'Pilih file gambar dari perangkat Anda.'}
            </p>
            <FieldError>{form.formState.errors.image?.message}</FieldError>
          </Field>
        </div>
        <div className="bg-card min-w-0 rounded-xl border p-5 sm:p-6">
          <div className="mb-6 border-b pb-5">
            <h2 className="font-semibold">Informasi Lapangan</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Lengkapi nama, kategori, dan detail lapangan.
            </p>
          </div>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="name">Nama Lapangan</FieldLabel>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Contoh: Padel Court 1"
                  className="h-10"
                />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="sport">Kategori</FieldLabel>
                <Controller
                  control={form.control}
                  name="sport"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="sport" className="h-10 w-full">
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
            </div>
            <Field>
              <FieldLabel htmlFor="description">Keterangan</FieldLabel>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Tambahkan informasi fasilitas atau kondisi lapangan..."
                className="min-h-32 resize-y"
              />
              <FieldError>{form.formState.errors.description?.message}</FieldError>
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
                        className={cn('text-sm font-medium', {
                          'text-green-600': value,
                          'text-red-600': !value
                        })}
                      >
                        {value ? 'Lapangan Aktif' : 'Lapangan Nonaktif'}
                      </label>
                      <p className="text-muted-foreground text-xs">
                        Aktifkan agar lapangan dapat menerima booking.
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={value}
                      onCheckedChange={(v) => onChange(v)}
                      aria-label="Status lapangan"
                    />
                  </div>
                )}
              />
              <FieldError>{form.formState.errors.isActive?.message}</FieldError>
            </Field>
          </FieldGroup>
        </div>
      </FieldSet>
      <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Simpan setelah selesai memperbarui informasi lapangan.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => router.push('/admin/kelola-lapangan')}
          >
            Batal
          </Button>
          <Button type="submit" loading={isSaving}>
            <Save />
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </form>
  );
};
export default EditCourtForm;
