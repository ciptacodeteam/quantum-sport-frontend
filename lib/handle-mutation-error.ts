import { getApiErrorMessage, isValidationError } from '@/lib/api-error';
import type { ApiError } from '@/types/react-query';
import { toast } from 'sonner';

type HandleMutationErrorOptions = {
  onError?: (error: ApiError) => void;
  fallbackMessage?: string;
  suppressValidationToast?: boolean;
};

export function handleMutationError(
  error: unknown,
  {
    onError,
    fallbackMessage = 'Terjadi kesalahan. Silakan coba lagi.',
    suppressValidationToast = true
  }: HandleMutationErrorOptions = {}
) {
  console.error('Error:', error);

  const shouldSuppressToast = suppressValidationToast && isValidationError(error);

  if (!shouldSuppressToast) {
    toast.error(getApiErrorMessage(error, fallbackMessage));
  }

  onError?.(error as ApiError);
}
