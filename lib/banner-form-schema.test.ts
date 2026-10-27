import { expect, it } from 'vitest';
import { bannerFormSchema, bannerLink } from './banner-form-schema';
const values = { link: '', sequence: 1, isActive: true };
it('allows an optional empty link and editing without replacing the image', () => {
  expect(bannerFormSchema(true).safeParse(values).success).toBe(true);
  expect(bannerFormSchema(false).safeParse(values).success).toBe(false);
});
it('accepts an uploaded image for creation and rejects files above the size limit', () => {
  expect(
    bannerFormSchema(false).safeParse({
      ...values,
      image: new File(['image'], 'banner.jpg', { type: 'image/jpeg' })
    }).success
  ).toBe(true);
  expect(
    bannerFormSchema(false).safeParse({
      ...values,
      image: new File([new Uint8Array(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    }).success
  ).toBe(false);
});
it('rejects a schedule ending before it starts', () => {
  const result = bannerFormSchema(true).safeParse({
    ...values,
    startAt: new Date('2026-10-28T10:00:00Z'),
    endAt: new Date('2026-10-28T09:00:00Z')
  });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues[0].path).toEqual(['endAt']);
});
it('only opens valid web links', () => {
  expect(bannerLink('javascript:alert(1)')).toBeUndefined();
  expect(bannerLink('https://example.com/promo')).toBe('https://example.com/promo');
});
