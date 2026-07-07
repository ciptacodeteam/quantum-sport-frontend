'use client';

import { mapApiErrorsToForm } from '@/lib/api-error';

import { Editor } from '@/components/blocks/editor-00/editor';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Separator } from '@/components/ui/separator';
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
import { adminUpdateMembershipMutationOptions } from '@/mutations/admin/membership';
import { adminMembershipQueryOptions } from '@/queries/admin/membership';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconTrash } from '@tabler/icons-react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
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

type Props = {
  membershipId: string;
};

const EditMembershipForm = ({ membershipId }: Props) => {
  const { data, refetch } = useSuspenseQuery(adminMembershipQueryOptions(membershipId));

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name || '',
      description: data?.description || '',
      content: data?.content || '',
      contentHtml: data?.contentHtml || '',
      sport: data?.sport || 'PADEL',
      type: data?.type || 'ALL_HOUR',
      price: data?.price || 0,
      sessions: data?.sessions || 0,
      duration: data?.duration || 30,
      sequence: data?.sequence || 1,
      isActive: data?.isActive,
      benefits: data?.benefits
        ? data.benefits.map((b) => ({
            value: b.benefit
          }))
        : [{ value: '' }]
    },
    mode: 'onChange'
  });

  // Benefits field array logic (must be after form is defined)
  const { fields, append, remove, update } = useFieldArray<FormSchema>({
    control: form.control,
    name: 'benefits'
  });

  const router = useRouter();

  const { mutate, isPending } = useMutation(
    adminUpdateMembershipMutationOptions({
      onSuccess: () => {
        refetch();
        router.refresh();
      },
      onError: (err) => {
        mapApiErrorsToForm(form, err);
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate({
      id: membershipId,
      data: {
        ...formData,
        benefits: formData.benefits.map((b) => b.value)
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 xl:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nama Value Pack</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  {...form.register('name')}
                  placeholder="e.g. John Doe"
                />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Deskripsi singkat mengenai membership"
                />
                <FieldError>{form.formState.errors.description?.message}</FieldError>
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
                        <SelectItem value="HAPPY_HOUR">Happy Hour (06:00 - 15:00)</SelectItem>
                        <SelectItem value="AFTER_HOUR">After Hour (15:00 - 00:00)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{form.formState.errors.type?.message}</FieldError>
              </Field>
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
                    />
                  )}
                />
                <FieldError>{form.formState.errors.price?.message}</FieldError>
              </Field>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="sessions">Jumlah Jam</FieldLabel>
                  <Controller
                    control={form.control}
                    name="sessions"
                    render={({ field }) => (
                      <NumberInput
                        id="sessions"
                        suffix=" x"
                        min={0}
                        allowNegative={false}
                        placeholder="e.g. 10 x"
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.sessions?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="duration">Durasi Value Pack (dalam hari)</FieldLabel>
                  <Controller
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <NumberInput
                        id="duration"
                        suffix=" hari"
                        min={0}
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
                <FieldLabel htmlFor="sequence">Urutan</FieldLabel>
                <Controller
                  control={form.control}
                  name="sequence"
                  render={({ field }) => (
                    <NumberInput
                      id="sequence"
                      min={0}
                      allowNegative={false}
                      placeholder="e.g. 1"
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
                <FieldError>{form.formState.errors.sequence?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="content">Konten Value Pack</FieldLabel>
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field }) => {
                    let parsedContent;
                    try {
                      parsedContent = field.value ? JSON.parse(field.value) : undefined;
                    } catch {
                      // If content is not valid JSON, treat it as undefined
                      parsedContent = undefined;
                    }
                    return (
                      <Editor
                        editorSerializedState={parsedContent}
                        onSerializedChange={(state) => field.onChange(JSON.stringify(state))}
                        onHtmlGenerated={(html) =>
                          form.setValue('contentHtml', html, { shouldValidate: true })
                        }
                      />
                    );
                  }}
                />
                <FieldError>{form.formState.errors.content?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="isActive">Status</FieldLabel>
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field: { value, onChange } }) => (
                    <div className="flex items-center gap-4">
                      <Switch id="isActive" checked={value} onCheckedChange={(v) => onChange(v)} />
                      <label
                        htmlFor="isActive"
                        className={cn('text-sm font-medium', {
                          'text-green-600': value,
                          'text-red-600': !value
                        })}
                      >
                        {value ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                  )}
                />
                <FieldError>{form.formState.errors.isActive?.message}</FieldError>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Separator className="my-4 xl:hidden" />
              <Field>
                <FieldLabel>Benefit Value Pack</FieldLabel>
                <div className="overflow-x-auto">
                  <div className="rounded-md border pb-2">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-2 py-2 text-left">Aksi</th>
                          <th className="px-2 py-2 text-left">Benefit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, idx) => (
                          <tr key={field.id}>
                            <td className="px-2 py-1 text-center">
                              <Button
                                type="button"
                                size="icon"
                                variant="lightDanger"
                                onClick={() => {
                                  if (fields.length === 1) {
                                    update(0, { value: '' });
                                  } else {
                                    remove(idx);
                                  }
                                }}
                                aria-label="Delete benefit"
                              >
                                <IconTrash className="size-4" />
                              </Button>
                            </td>
                            <td className="w-full px-2 py-2 pl-0">
                              <Input
                                {...form.register(`benefits.${idx}.value` as const)}
                                placeholder={`Benefit ${idx + 1}`}
                              />
                              <FieldError>
                                {form.formState.errors.benefits?.[idx]?.value?.message as string}
                              </FieldError>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => append({ value: '' })}
                    >
                      + Add Benefit
                    </Button>
                  </div>
                </div>
              </Field>
            </FieldGroup>
          </div>
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
export default EditMembershipForm;
