import type { ApiError } from './react-query';

export type MutationFuncProps = {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
};
