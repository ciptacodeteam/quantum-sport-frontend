import type { QueryClient } from '@tanstack/react-query';
import type { ApiError } from './react-query';

export type MutationFuncProps = {
  queryClient?: QueryClient;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
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
