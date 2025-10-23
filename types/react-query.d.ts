import '@tanstack/react-query';
import type { ZodFlattenedError } from 'zod';

export interface ApiError {
  code: number;
  success: boolean;
  msg: string;
  errors?: Record<string, unknown> | ZodFlattenedError | null;
}

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
