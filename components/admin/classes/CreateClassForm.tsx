'use client';

import { Editor } from '@/components/blocks/editor-00/editor';
import { Button } from '@/components/ui/button';
import DatetimePicker from '@/components/ui/datetime-picker';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GENDER, GENDER_OPTIONS } from '@/lib/constants';
import { adminCreateClassMutationOptions } from '@/mutations/admin/class';
import { adminClassesQueryOptions } from '@/queries/admin/class';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }),
  description: z.string().optional(),
  content: z.string().optional(),
  organizerName: z.string().optional(),
  speakerName: z.string().optional(),
  image: z.file().optional(),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  price: z.number().min(0),
  sessions: z.number().min(1),
  capacity: z.number().min(1),
  maxBookingPax: z.number().min(1),
  gender: z.nativeEnum(GENDER),
  ageMin: z.number().min(0),
  isActive: z.boolean().default(true)
});

type FormSchema = z.infer<typeof formSchema>;

const CreateClassForm = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      content: '',
      organizerName: '',
      speakerName: '',
      image: undefined,
      startDate: dayjs().toDate(),
      endDate: dayjs().toDate(),
      startTime: '',
      endTime: '',
      price: 0,
      sessions: 1,
      capacity: 1,
      maxBookingPax: 1,
      gender: GENDER.ALL,
      ageMin: 0,
      isActive: true
    }
  });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateClassMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminClassesQueryOptions.queryKey });
        form.reset();
      },
      onError: (err) => {
        if (err.errors?.name === 'ZodError') {
          const fieldErrors = err.errors.fields as Record<string, string>;
          Object.entries(fieldErrors).forEach(([fieldName, message]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message
            });
          });
        }
      }
    })
  );

  const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    console.log('🚀 ~ onSubmit ~ formData:', formData);
    mutate(formData);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-2">
            <FieldGroup>
              <header className="space-y-2 border-b pb-3">
                <FieldLegend>Detail Kelas</FieldLegend>
                <FieldDescription>
                  Atur detail kelas seperti nama, deskripsi, penyelenggara, dan lain-lain.
                </FieldDescription>
              </header>

              <Field>
                <FieldLabel htmlFor="image">Image</FieldLabel>
                {imagePreview && (
                  <Image
                    src={String(imagePreview)}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="border-muted max-w-xs rounded-md border object-cover"
                  />
                )}
                <Controller
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <Input
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
                          setImagePreview(null);
                        }
                      }}
                    />
                  )}
                />
                <FieldError>{form.formState.errors.image?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="name">Nama Kelas</FieldLabel>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="e.g. Kelas Belajar Padel"
                />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="organizerName">Nama Penyelenggara</FieldLabel>
                  <Input
                    id="organizerName"
                    {...form.register('organizerName')}
                    placeholder="e.g. John Doe"
                  />
                  <FieldError>{form.formState.errors.organizerName?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="speakerName">Nama Pembicara</FieldLabel>
                  <Input
                    id="speakerName"
                    {...form.register('speakerName')}
                    placeholder="e.g. Jane Doe"
                  />
                  <FieldError>{form.formState.errors.speakerName?.message}</FieldError>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="description">Deskripsi Kelas</FieldLabel>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="e.g. Kelas untuk pemula"
                />
                <FieldError>{form.formState.errors.description?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="content">Konten Membership</FieldLabel>
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <Editor
                      editorSerializedState={field.value ? JSON.parse(field.value) : undefined}
                      onSerializedChange={(state) => field.onChange(JSON.stringify(state))}
                    />
                  )}
                />
                <FieldError>{form.formState.errors.content?.message}</FieldError>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <header className="space-y-2 border-b pb-3">
                <FieldLegend>Pengaturan Kelas</FieldLegend>
                <FieldDescription>
                  Atur detail kelas seperti jadwal, harga, kapasitas, dan lain-lain.
                </FieldDescription>
              </header>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="startDate">Mulai Dari</FieldLabel>
                  <Controller
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <DatetimePicker
                        value={field.value}
                        onValueChange={(datetime) => {
                          field.onChange(datetime);
                          const hour = datetime?.getHours();
                          const minute = datetime?.getMinutes();
                          form.setValue(
                            'startTime',
                            `${hour?.toString().padStart(2, '0')}:${minute?.toString().padStart(2, '0')}`
                          );
                        }}
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.startDate?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="endDate">Selesai Pada</FieldLabel>
                  <Controller
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <DatetimePicker
                        value={field.value}
                        onValueChange={(datetime) => {
                          field.onChange(datetime);
                          const hour = datetime?.getHours();
                          const minute = datetime?.getMinutes();
                          form.setValue(
                            'endTime',
                            `${hour?.toString().padStart(2, '0')}:${minute?.toString().padStart(2, '0')}`
                          );
                        }}
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.endDate?.message}</FieldError>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="price">Harga Kelas</FieldLabel>
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
                <FieldError>{form.formState.errors.sessions?.message}</FieldError>
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <div className="inline-flex gap-2">
                    <FieldLabel htmlFor="sessions">Jumlah Sesi</FieldLabel>
                    <Tooltip>
                      <TooltipTrigger>
                        <IconInfoCircle className="text-muted-foreground size-4 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>Maksimal Sesi yang User dapat ikuti</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Controller
                    control={form.control}
                    name="sessions"
                    render={({ field }) => (
                      <NumberInput
                        id="sessions"
                        thousandSeparator="."
                        decimalSeparator=","
                        suffix=" sesi"
                        min={0}
                        allowNegative={false}
                        placeholder="e.g. 10 sesi"
                        value={field.value}
                        onValueChange={field.onChange}
                        withControl={false}
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.sessions?.message}</FieldError>
                </Field>
                <Field>
                  <div className="inline-flex gap-2">
                    <FieldLabel htmlFor="capacity">Kapasitas Kelas</FieldLabel>
                    <Tooltip>
                      <TooltipTrigger>
                        <IconInfoCircle className="text-muted-foreground size-4 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>Maksimal kapasitas peserta yang dapat mengikuti kelas ini.</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Controller
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <NumberInput
                        id="capacity"
                        thousandSeparator="."
                        decimalSeparator=","
                        suffix=" orang"
                        min={0}
                        allowNegative={false}
                        placeholder="e.g. 20 orang"
                        value={field.value}
                        onValueChange={field.onChange}
                        withControl={false}
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.capacity?.message}</FieldError>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <div className="inline-flex gap-2">
                    <FieldLabel htmlFor="maxBookingPax">Maksimal Pemesanan</FieldLabel>
                    <Tooltip>
                      <TooltipTrigger>
                        <IconInfoCircle className="text-muted-foreground size-4 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>
                          Maksimal jumlah peserta yang dapat dipesan dalam satu kali transaksi.
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Controller
                    control={form.control}
                    name="maxBookingPax"
                    render={({ field }) => (
                      <NumberInput
                        id="maxBookingPax"
                        thousandSeparator="."
                        decimalSeparator=","
                        suffix=" orang"
                        min={0}
                        allowNegative={false}
                        placeholder="e.g. 2 orang"
                        value={field.value}
                        onValueChange={field.onChange}
                        withControl={false}
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.maxBookingPax?.message}</FieldError>
                </Field>
                <Field>
                  <div className="inline-flex gap-2">
                    <FieldLabel htmlFor="ageMin">Minimal Umur</FieldLabel>
                    <Tooltip>
                      <TooltipTrigger>
                        <IconInfoCircle className="text-muted-foreground size-4 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>
                          Atur minimal umur peserta yang boleh mendaftar di kelas ini. Misal 18
                          tahun ke atas.
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Controller
                    control={form.control}
                    name="ageMin"
                    render={({ field }) => (
                      <NumberInput
                        id="ageMin"
                        thousandSeparator="."
                        decimalSeparator=","
                        suffix=" tahun"
                        min={0}
                        allowNegative={false}
                        placeholder="e.g. 18 tahun"
                        value={field.value}
                        onValueChange={field.onChange}
                        withControl={false}
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.ageMin?.message}</FieldError>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="gender">Jenis Kelamin</FieldLabel>
                <Controller
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <RadioGroup defaultValue={field.value} onValueChange={field.onChange}>
                      {GENDER_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value}>{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
                <FieldError>{form.formState.errors.gender?.message}</FieldError>
              </Field>
            </FieldGroup>
          </div>

          <Field className="mt-2 w-fit">
            <Button type="submit" loading={isPending}>
              Simpan
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};

export default CreateClassForm;
