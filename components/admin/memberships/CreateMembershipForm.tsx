'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Editor } from '@/components/blocks/editor-00/editor';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adminCreateMembershipMutationOptions } from '@/mutations/admin/membership';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconTrash, IconPlus, IconDeviceFloppy } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Controller, type SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }),
  description: z.string(),
  content: z.string(),
  contentHtml: z.string(),
  sport: z.enum(['PADEL', 'TENNIS']),
  type: z.enum(['ALL_HOUR', 'HAPPY_HOUR', 'AFTER_HOUR']),
  price: z.number().min(0, { message: 'Harga tidak boleh negatif' }),
  sessions: z.number().min(0, { message: 'Jumlah jam tidak boleh negatif' }),
  duration: z.number().min(1, { message: 'Durasi minimal 1 hari' }),
  sequence: z.number().min(1, { message: 'Urutan minimal 1' }),
  isActive: z.boolean().optional(),
  benefits: z.array(z.object({ value: z.string() }))
});

type FormSchema = z.infer<typeof formSchema>;

const CreateMembershipForm = () => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      content: '',
      contentHtml: '',
      sport: 'PADEL',
      type: 'ALL_HOUR',
      price: 0,
      sessions: 0,
      duration: 30,
      sequence: 1,
      isActive: true,
      benefits: [{ value: '' }]
    }
  });

  // Benefits field array logic (must be after form is defined)
  const { fields, append, remove, update } = useFieldArray<FormSchema>({
    control: form.control,
    name: 'benefits'
  });

  const router = useRouter();

  const { mutate, isPending } = useMutation(
    adminCreateMembershipMutationOptions({
      onSuccess: () => {
        form.reset();
        router.push('/admin/kelola-membership');
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate({
      ...formData,
      benefits: formData.benefits.map((b) => b.value)
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full min-w-0 space-y-6">
      <FieldSet className="min-w-0 gap-6" disabled={isPending}>
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <section
            className="bg-card min-w-0 rounded-xl border p-5 sm:p-6"
            aria-labelledby="pack-info-title"
          >
            <div className="mb-5 space-y-1 border-b pb-5">
              <h2 id="pack-info-title" className="font-semibold">
                Informasi Value Pack
              </h2>
              <p className="text-muted-foreground text-sm">
                Nama dan kategori paket yang ditampilkan kepada pelanggan.
              </p>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nama Value Pack</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  {...form.register('name')}
                  placeholder="Contoh: Paket Padel 50 Jam"
                />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
                <Textarea
                  id="description"
                  className="min-h-24 resize-y"
                  {...form.register('description')}
                  placeholder="Jelaskan keunggulan dan penggunaan paket ini..."
                />
                <FieldError>{form.formState.errors.description?.message}</FieldError>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
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
                  <FieldLabel htmlFor="type">Jenis Jam</FieldLabel>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="type" className="w-full">
                          <SelectValue placeholder="Pilih jenis jam" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL_HOUR">All Hour</SelectItem>
                          <SelectItem value="HAPPY_HOUR">Happy Hour</SelectItem>
                          <SelectItem value="AFTER_HOUR">Peak Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    Jam paket mengikuti pengaturan cabang dan tanggal bermain.
                  </p>
                  <FieldError>{form.formState.errors.type?.message}</FieldError>
                </Field>
              </div>
            </FieldGroup>
          </section>
          <section
            className="bg-card min-w-0 rounded-xl border p-5 sm:p-6"
            aria-labelledby="pack-pricing-title"
          >
            <div className="mb-5 space-y-1 border-b pb-5">
              <h2 id="pack-pricing-title" className="font-semibold">
                Harga & Ketentuan
              </h2>
              <p className="text-muted-foreground text-sm">
                Tentukan harga, kuota jam, dan masa berlaku paket.
              </p>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="price">Harga</FieldLabel>
                <Controller
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <NumberInput
                      id="price"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="Rp "
                      min={0}
                      allowNegative={false}
                      placeholder="e.g. Rp 100.000"
                      value={field.value}
                      onValueChange={field.onChange}
                      withControl={false}
                    />
                  )}
                />
                <FieldError>{form.formState.errors.price?.message}</FieldError>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="sessions">Jumlah Jam</FieldLabel>
                  <Controller
                    control={form.control}
                    name="sessions"
                    render={({ field }) => (
                      <NumberInput
                        id="sessions"
                        suffix=" jam"
                        min={0}
                        allowNegative={false}
                        placeholder="Contoh: 50 jam"
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.sessions?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="duration">Masa Berlaku</FieldLabel>
                  <Controller
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <NumberInput
                        id="duration"
                        suffix=" hari"
                        min={1}
                        allowNegative={false}
                        placeholder="e.g. 30 hari"
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.duration?.message}</FieldError>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="sequence">Urutan Tampilan</FieldLabel>
                <Controller
                  control={form.control}
                  name="sequence"
                  render={({ field }) => (
                    <NumberInput
                      id="sequence"
                      min={1}
                      allowNegative={false}
                      placeholder="e.g. 1"
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                <FieldError>{form.formState.errors.sequence?.message}</FieldError>
              </Field>
              <p className="text-muted-foreground text-xs">
                Angka urutan yang lebih kecil ditampilkan lebih awal pada daftar paket.
              </p>
            </FieldGroup>
          </section>
        </div>
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section
            className="bg-card min-w-0 rounded-xl border p-5 sm:p-6"
            aria-labelledby="pack-content-title"
          >
            <div className="mb-5 space-y-1 border-b pb-5">
              <h2 id="pack-content-title" className="font-semibold">
                Detail Paket
              </h2>
              <p className="text-muted-foreground text-sm">
                Tambahkan penjelasan lengkap serta syarat penggunaan Value Pack.
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="content">Konten Value Pack</FieldLabel>
              <Controller
                control={form.control}
                name="content"
                render={({ field }) => (
                  <Editor
                    editorSerializedState={field.value ? JSON.parse(field.value) : undefined}
                    onSerializedChange={(state) => field.onChange(JSON.stringify(state))}
                    onHtmlGenerated={(html) =>
                      form.setValue('contentHtml', html, { shouldValidate: true })
                    }
                  />
                )}
              />
              <FieldError>{form.formState.errors.content?.message}</FieldError>
            </Field>
          </section>
          <section
            className="bg-card min-w-0 rounded-xl border p-5 sm:p-6"
            aria-labelledby="pack-benefits-title"
          >
            <div className="mb-5 space-y-1 border-b pb-5">
              <h2 id="pack-benefits-title" className="font-semibold">
                Benefit Value Pack
              </h2>
              <p className="text-muted-foreground text-sm">
                Tuliskan keuntungan paket dalam poin-poin singkat.
              </p>
            </div>
            <div className="space-y-4">
              {fields.map((field, idx) => (
                <Field key={field.id} className="gap-2">
                  <FieldLabel
                    htmlFor={`benefit-${field.id}`}
                    className="text-muted-foreground text-xs"
                  >
                    Benefit {idx + 1}
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`benefit-${field.id}`}
                      {...form.register(`benefits.${idx}.value` as const)}
                      placeholder="Contoh: Bebas pilih jadwal bermain"
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => (fields.length === 1 ? update(0, { value: '' }) : remove(idx))}
                      aria-label={`Hapus benefit ${idx + 1}`}
                      title="Hapus benefit"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                  <FieldError>{form.formState.errors.benefits?.[idx]?.value?.message}</FieldError>
                </Field>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => append({ value: '' })}
              >
                <IconPlus />
                Tambah Benefit
              </Button>
            </div>
          </section>
        </div>
      </FieldSet>
      <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Periksa kembali informasi paket sebelum menyimpan.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.push('/admin/kelola-membership')}
          >
            Batal
          </Button>
          <Button type="submit" loading={isPending}>
            <IconDeviceFloppy />
            Simpan Value Pack
          </Button>
        </div>
      </div>
    </form>
  );
};
export default CreateMembershipForm;
