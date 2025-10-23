import type { QueryClient } from '@tanstack/react-query';
import type { ApiError } from './react-query';

export type MutationFuncProps = {
  queryClient?: QueryClient;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
};
