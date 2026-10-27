import { z } from 'zod';

export const bannerFormSchema = (editing: boolean) =>
  z
    .object({
      image: z
        .file()
        .min(1, 'Pilih gambar banner.')
        .max(5 * 1024 * 1024, 'Ukuran gambar maksimal 5 MB.')
        .mime(['image/jpeg', 'image/png', 'image/webp'], 'Gunakan gambar JPG, PNG, atau WebP.')
        .optional(),
      link: z
        .string()
        .trim()
        .refine(
          (value) => !value || (/^https?:\/\//i.test(value) && URL.canParse(value)),
          'Gunakan tautan lengkap dengan https:// atau http://.'
        ),
      sequence: z.number().int('Urutan harus berupa bilangan bulat.').min(1, 'Urutan minimal 1.'),
      isActive: z.boolean(),
      startAt: z.date().optional(),
      endAt: z.date().optional()
    })
    .superRefine((value, context) => {
      if (!editing && !value.image)
        context.addIssue({ code: 'custom', path: ['image'], message: 'Pilih gambar banner.' });
      if (value.startAt && value.endAt && value.endAt <= value.startAt)
        context.addIssue({
          code: 'custom',
          path: ['endAt'],
          message: 'Waktu selesai harus setelah waktu mulai.'
        });
    });
export type BannerFormValues = z.infer<ReturnType<typeof bannerFormSchema>>;

export function bannerLink(link?: string | null) {
  if (!link || !/^https?:\/\//i.test(link) || !URL.canParse(link)) return undefined;
  return link;
}
