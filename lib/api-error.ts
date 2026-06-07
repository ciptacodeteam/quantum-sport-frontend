import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

export type ValidationErrors = {
  name: string;
  fields: Record<string, string>;
};

export type ApiErrorResponse = {
  code?: number;
  success?: boolean;
  msg?: string;
  message?: string;
  errors?: ValidationErrors | Record<string, unknown> | null;
};

export function isValidationError(error: unknown): error is ApiErrorResponse & {
  errors: ValidationErrors;
} {
  if (!error || typeof error !== 'object') return false;

  const apiError = error as ApiErrorResponse;

  if (apiError.code === 422) return true;

  const errors = apiError.errors;
  if (!errors || typeof errors !== 'object') return false;

  return (
    'name' in errors &&
    errors.name === 'ZodError' &&
    'fields' in errors &&
    typeof errors.fields === 'object' &&
    errors.fields !== null
  );
}

export function getValidationFieldErrors(error: unknown): Record<string, string> | null {
  if (!isValidationError(error)) return null;
  return error.errors.fields;
}

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Silakan coba lagi.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const apiError = error as ApiErrorResponse;
  return apiError.msg || apiError.message || fallback;
}

type MapApiErrorsToFormOptions<T extends FieldValues> = {
  fieldMap?: Record<string, FieldPath<T>>;
};

export function mapApiErrorsToForm<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
  options?: MapApiErrorsToFormOptions<T>
): boolean {
  const fieldErrors = getValidationFieldErrors(error);
  if (!fieldErrors) return false;

  Object.entries(fieldErrors).forEach(([fieldName, message]) => {
    const mappedField = (options?.fieldMap?.[fieldName] ?? fieldName) as FieldPath<T>;
    form.setError(mappedField, { type: 'server', message });
  });

  return true;
}

export function normalizeApiErrorResponse<T extends Record<string, unknown>>(response: T): T {
  const message = typeof response.message === 'string' ? response.message : undefined;
  const msg = typeof response.msg === 'string' ? response.msg : undefined;

  if (message && !msg) {
    return { ...response, msg: message };
  }

  if (msg && !message) {
    return { ...response, message: msg };
  }

  return response;
}
