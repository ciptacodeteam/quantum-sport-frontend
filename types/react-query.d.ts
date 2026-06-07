import '@tanstack/react-query';

export type ValidationErrors = {
  name: string;
  fields: Record<string, string>;
};

export interface ApiError {
  code: number;
  success: boolean;
  msg?: string;
  message?: string;
  errors?: ValidationErrors | null;
}

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
