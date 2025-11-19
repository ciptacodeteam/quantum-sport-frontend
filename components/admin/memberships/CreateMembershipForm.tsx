'use client';

import { Editor } from '@/components/blocks/editor-00/editor';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { adminCreateMembershipMutationOptions } from '@/mutations/admin/membership';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconTrash } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Controller, type SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }),
  description: z.string(),
  content: z.string(),
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

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate({
      ...formData,
      benefits: formData.benefits.map((b) => b.value)
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 xl:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nama Membership</FieldLabel>
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
                  <FieldLabel htmlFor="duration">Durasi Membership (dalam hari)</FieldLabel>
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
              <Separator className="my-4 xl:hidden" />
              <Field>
                <FieldLabel>Benefit Membership</FieldLabel>
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
export default CreateMembershipForm;
