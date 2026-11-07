import { expect, it } from 'vitest';
import {
  getApiErrorMessage,
  getValidationFieldErrors,
  normalizeApiErrorResponse
} from './api-error';

it('shows the field-level reason instead of a generic validation error', () => {
  const error = normalizeApiErrorResponse({
    code: 422,
    message: 'Validation Error',
    errors: {
      name: 'ZodError',
      fields: { courtSlots: 'Maksimal 1.000 slot lapangan dalam satu pemesanan.' }
    }
  });
  expect(getApiErrorMessage(error)).toBe('Maksimal 1.000 slot lapangan dalam satu pemesanan.');
});
it('reports distinct validation reasons without duplicating the same message', () => {
  expect(
    getApiErrorMessage({
      code: 422,
      errors: {
        name: 'ZodError',
        fields: { name: 'Isi nama.', activityName: 'Isi nama.', phone: 'Isi telepon.' }
      }
    })
  ).toBe('Isi nama. Isi telepon.');
});
it('handles a validation response without field details and keeps ordinary error messages', () => {
  expect(getValidationFieldErrors({ code: 422, errors: null })).toBeNull();
  expect(getApiErrorMessage({ code: 422, message: 'Data tidak valid.' })).toBe('Data tidak valid.');
  expect(getApiErrorMessage({ code: 400, message: 'Slot sudah dipesan.' })).toBe(
    'Slot sudah dipesan.'
  );
  expect(getApiErrorMessage(null, 'Coba lagi.')).toBe('Coba lagi.');
});
