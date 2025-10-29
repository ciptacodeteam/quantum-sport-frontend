'use client';

import { useConfirm } from '@/components/ui/confirm-dialog';
import type { ApiError } from '@/types/react-query';
import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
  type UseMutationOptions
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import * as React from 'react';
import { toast } from 'sonner';

type ToastMsg<T> = string | ((data: T) => string);

type InvalidateRefetchOpt = QueryKey | QueryKey[] | ((qc: QueryClient) => Promise<void> | void);

type NavigateTo<T> =
  | string
  | ((result: T) => string)
  | { href: string; replace?: boolean }
  | ((result: T) => { href: string; replace?: boolean });

type RouterInvalidateOpt =
  | string[] // paths convenience — will trigger a router.refresh()
  | ((router: ReturnType<typeof useRouter>) => Promise<void> | void);

export type ConfirmMutationUIOptions<TResult> = {
  // confirm dialog
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;

  // toast
  toastMessages?: {
    loading?: string;
    success?: ToastMsg<TResult>;
    error?: ToastMsg<unknown>;
  };

  // React Query cache work
  invalidate?: InvalidateRefetchOpt;
  refetch?: InvalidateRefetchOpt;

  // TanStack Router hooks
  router?: {
    // Invalidate route loaders after success
    invalidate?: RouterInvalidateOpt;
    // Navigate after success (static or based on result)
    navigateTo?: NavigateTo<TResult>;
  };
};

function runRQInvalidateOrRefetch(
  qc: QueryClient,
  opt: InvalidateRefetchOpt | undefined,
  action: 'invalidate' | 'refetch'
) {
  if (!opt) return;
  if (typeof opt === 'function') return void opt(qc);
  // `opt` may be either a single QueryKey (which itself is an array, e.g. ['admin','inventories'])
  // or an array of QueryKeys (e.g. [ ['a'], ['b'] ]). Detect that and normalize to an array
  // of QueryKey values so we don't accidentally iterate the composed key's elements.
  let keys: QueryKey[];
  if (Array.isArray(opt)) {
    const isArrayOfKeys = opt.length > 0 && opt.every((el) => Array.isArray(el));
    keys = isArrayOfKeys ? (opt as QueryKey[]) : ([opt as QueryKey] as QueryKey[]);
  } else {
    keys = [opt as QueryKey];
  }

  if (action === 'invalidate') {
    return Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })));
  }

  return Promise.all(keys.map((k) => qc.refetchQueries({ queryKey: k })));
}

async function runRouterInvalidate(
  router: ReturnType<typeof useRouter>,
  opt?: RouterInvalidateOpt
) {
  if (!opt) return;
  if (typeof opt === 'function') return void (await opt(router));
  // If an array of paths is passed, we cannot individually revalidate server components
  // without next/cache helpers, so call router.refresh() to refresh the current route.
  // This is conservative but works in most app router setups.
  try {
    router.refresh();
  } catch {
    // no-op if not supported
  }
}

/**
 * useConfirmMutation — React Query + TanStack Router
 */
export function useConfirmMutation<TVars = void, TResult = unknown>(
  mutationOptions: UseMutationOptions<TResult, ApiError, TVars>,
  ui?: ConfirmMutationUIOptions<TResult>
) {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const { mutateAsync } = useMutation<TResult, ApiError, TVars>({
    onSuccess: async () => {
      await runRQInvalidateOrRefetch(qc, ui?.invalidate, 'invalidate');
      await runRQInvalidateOrRefetch(qc, ui?.refetch, 'refetch');
      await runRouterInvalidate(router, ui?.router?.invalidate);
    },
    ...mutationOptions
  });

  const router = useRouter();

  const confirmAndMutate = React.useCallback(
    async (vars: TVars) => {
      const ok = await confirm({
        title: ui?.title ?? 'Apakah Anda yakin?',
        description: ui?.description ?? 'Aksi ini tidak dapat dibatalkan.',
        confirmText: ui?.confirmText ?? 'Konfirmasi',
        cancelText: ui?.cancelText ?? 'Batal',
        destructive: ui?.destructive ?? true
      });
      if (!ok) return;

      const loading = ui?.toastMessages?.loading ?? 'Processing…';
      const success = ui?.toastMessages?.success ?? 'Success';
      const error = ui?.toastMessages?.error ?? 'An error occurred';

      // Wait for the mutation to complete before running invalidation/refetch/navigation.
      // toast.promise returns a promise that resolves/rejects with the mutation result/error.
      const result = await toast.promise(mutateAsync(vars), {
        loading,
        success: (r) => (typeof success === 'function' ? success(r) : success),
        error: (e) => (typeof error === 'function' ? error(e) : (error as string))
      });

      // React Query cache ops
      //   await runRQInvalidateOrRefetch(qc, ui?.invalidate, 'invalidate');
      //   await runRQInvalidateOrRefetch(qc, ui?.refetch, 'refetch');

      // TanStack Router invalidation
      //   await runRouterInvalidate(router, ui?.router?.invalidate);

      // Optional navigation (Next.js app router)
      const nav = ui?.router?.navigateTo;
      if (nav) {
        const out = typeof nav === 'function' ? nav(result as TResult) : nav;
        let href: string;
        let replace = false;
        if (typeof out === 'string') href = out;
        else {
          href = (out as any).href;
          replace = !!(out as any).replace;
        }

        try {
          if (replace) router.replace(href);
          else router.push(href);
        } catch {
          // swallow navigation errors
        }
      }

      return result;
    },
    [confirm, mutateAsync, qc, router, ui]
  );

  return { confirmAndMutate };
}
