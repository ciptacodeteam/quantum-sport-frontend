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
          className="sm:max-w-sm"
        >
          <DialogHeader className="items-center text-center">
            {icon ?? (
              <TriangleAlert
                className={cn('mb-2 size-16 text-red-600', destructive ? '' : 'text-foreground/70')}
              />
            )}
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className={cn('mt-2 text-center text-balance', bodyClassName)}>
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className={cn('mt-4 gap-4 sm:justify-center', footerClassName)}>
            <Button
              variant="ghost"
              onClick={close}
              disabled={state.isPending}
              className="min-w-24 flex-1"
            >
              {cancelText}
            </Button>
            <Button
              variant={destructive ? 'destructive' : 'default'}
              onClick={doConfirm}
              disabled={state.isPending}
              className="min-w-28 flex-1"
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
