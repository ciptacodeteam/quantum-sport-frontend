'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { TriangleAlert } from 'lucide-react';
import * as React from 'react';

type ConfirmOptions = {
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  icon?: React.ReactNode;
  dismissible?: boolean; // block close outside/ESC when false or when pending
  bodyClassName?: string;
  footerClassName?: string;
};

type InternalState = {
  open: boolean;
  isPending: boolean;
  options: ConfirmOptions;
  resolve?: (ok: boolean) => void;
};

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;
const ConfirmCtx = React.createContext<ConfirmFn | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<InternalState>({
    open: false,
    isPending: false,
    options: {}
  });

  const confirm = React.useCallback<ConfirmFn>((options = {}) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        isPending: false,
        options,
        resolve
      });
    });
  }, []);

  const close = React.useCallback(() => {
    if (state.isPending) return;
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false, resolve: undefined }));
  }, [state.isPending, state.resolve]);

  const doConfirm = React.useCallback(async () => {
    setState((s) => ({ ...s, isPending: true }));
    try {
      state.resolve?.(true);
    } finally {
      setState((s) => ({
        ...s,
        open: false,
        isPending: false,
        resolve: undefined
      }));
    }
  }, [state.resolve]);

  const {
    title = 'Apakah Anda yakin?',
    description = 'Aksi ini tidak dapat dibatalkan.',
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    destructive = false,
    icon,
    dismissible = true,
    bodyClassName,
    footerClassName
  } = state.options;

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Dialog open={state.open} onOpenChange={(o) => (o ? null : close())}>
        <DialogContent
          onEscapeKeyDown={(e) => {
            if (!dismissible || state.isPending) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (!dismissible || state.isPending) e.preventDefault();
          }}
          showCloseButton={dismissible && !state.isPending}
          className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] gap-6 overflow-y-auto rounded-none border-black/15 bg-[#f8f8f6] p-6 text-[#171717] sm:max-w-md sm:p-8"
        >
          <DialogHeader className="items-center gap-0 text-center sm:text-center">
            <div
              className={cn(
                'mb-5 flex size-12 items-center justify-center border [&_svg]:size-6',
                destructive
                  ? 'border-red-600/20 bg-red-600/5 text-red-600'
                  : 'border-[#ad422b]/20 bg-[#ad422b]/5 text-[#ad422b]'
              )}
            >
              {icon ?? <TriangleAlert strokeWidth={1.5} aria-hidden="true" />}
            </div>
            <DialogTitle className="text-xl leading-snug font-medium tracking-tight text-[#171717]">
              {title}
            </DialogTitle>
            <DialogDescription
              asChild
              className={cn(
                'mt-3 text-center text-sm leading-relaxed text-pretty text-black/55',
                bodyClassName
              )}
            >
              <div>{description}</div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter
            className={cn('grid grid-cols-2 gap-3 border-t border-black/15 pt-5', footerClassName)}
          >
            <Button
              variant="outline"
              onClick={close}
              disabled={state.isPending}
              className="h-12 w-full min-w-0 rounded-full border-black/20 bg-transparent px-3 text-xs font-medium text-[#171717] shadow-none hover:bg-black/5 sm:text-sm"
            >
              {cancelText}
            </Button>
            <Button
              variant={destructive ? 'destructive' : 'default'}
              onClick={doConfirm}
              disabled={state.isPending}
              className={cn(
                'h-12 w-full min-w-0 rounded-full px-3 text-xs font-medium text-white shadow-none sm:text-sm',
                destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#111111] hover:bg-black/80'
              )}
            >
              {state.isPending ? 'Memproses...' : confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmCtx);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmDialogProvider>');
  return ctx;
}
