import type { QueryClient } from '@tanstack/react-query';
import type { ApiError } from './react-query';

export type MutationFuncProps = {
  queryClient?: QueryClient;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
};

export type CreateMutationPayload = Record<string, unknown>;

export type UpdateMutationPayload<T = Record<string, unknown>> = {
  id: string;
  data: T;
};

export type AppSidebarItem = {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  isActive?: boolean;
  isUnrealeased?: boolean;
  items?: {
    title: string;
    url: string;
    isUnrealeased?: boolean;
  }[];
};

export type MenuItem = {
  subtitle: string;
  title: string;
  url: string;
  icon: React.ReactNode;
};

export type SearchParamsData = {
  id?: number | string;
  page?: string | number | null;
  limit?: string | number | null;
  slug?: string;
  search?: string;
  sort?: string;
  order?: string;
  fromDate?: string | null;
  toDate?: string | null;
  staffId?: number | null;
  [key: string]: TQueryParams;
};

export type IdParams<T = string> = { id: T };
