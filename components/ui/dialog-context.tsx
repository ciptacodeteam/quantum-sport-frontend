'use client';

import React from 'react';
import { Dialog as RadixDialog } from './dialog';

type DialogPayload = any;

type DialogState = {
  open: boolean;
  payload?: DialogPayload;
  version: number; // bump to force updates
};

type DialogMap = Record<string, DialogState>;

type DialogContextValue = {
  openDialog: (id: string, payload?: DialogPayload) => void;
  closeDialog: (id?: string) => void; // id omitted => close all
  toggleDialog: (id: string, payload?: DialogPayload) => void;
  isOpen: (id: string) => boolean;
  getPayload: (id: string) => DialogPayload | undefined;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = React.useState<DialogMap>({});

  const openDialog = React.useCallback((id: string, payload?: DialogPayload) => {
    setDialogs((cur) => ({
      ...cur,
      [id]: { open: true, payload, version: (cur[id]?.version ?? 0) + 1 }
    }));
  }, []);

  const closeDialog = React.useCallback((id?: string) => {
    if (!id) {
      setDialogs((cur) => {
        const next: DialogMap = {};
        for (const k of Object.keys(cur)) {
          next[k] = { ...cur[k], open: false, version: cur[k].version + 1 };
        }
        return next;
      });
      return;
    }

    setDialogs((cur) => ({
      ...cur,
      [id]: {
        ...(cur[id] ?? { open: false, version: 0 }),
        open: false,
        version: (cur[id]?.version ?? 0) + 1
      }
    }));
  }, []);

  const toggleDialog = React.useCallback((id: string, payload?: DialogPayload) => {
    setDialogs((cur) => {
      const current = cur[id];
      if (!current || !current.open) {
        return { ...cur, [id]: { open: true, payload, version: (cur[id]?.version ?? 0) + 1 } };
      }
      return { ...cur, [id]: { ...current, open: false, version: current.version + 1 } };
    });
  }, []);

  const isOpen = React.useCallback((id: string) => !!dialogs[id]?.open, [dialogs]);
  const getPayload = React.useCallback((id: string) => dialogs[id]?.payload, [dialogs]);

  const value = React.useMemo(
    () => ({ openDialog, closeDialog, toggleDialog, isOpen, getPayload }),
    [openDialog, closeDialog, toggleDialog, isOpen, getPayload]
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function useDialog() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider');
  return ctx;
}

/**
 * Hook that returns reactive dialog state for a given id.
 * Useful inside a Dialog slot to get payload and close function.
 */
export function useDialogState(id: string) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('useDialogState must be used within a DialogProvider');

  const [open, setOpen] = React.useState<boolean>(ctx.isOpen(id));
  const [payload, setPayload] = React.useState<DialogPayload | undefined>(ctx.getPayload(id));
  const isOpenFn = ctx.isOpen;
  const getPayloadFn = ctx.getPayload;

  // Subscribe to context changes by polling minimal values.
  // We keep subscription simple: update whenever ctx.getPayload/isOpen results change.
  React.useEffect(() => {
    setOpen(isOpenFn(id));
    setPayload(getPayloadFn(id));
  }, [id, isOpenFn, getPayloadFn]);

  const openDialog = React.useCallback((p?: DialogPayload) => ctx.openDialog(id, p), [ctx, id]);
  const closeDialog = React.useCallback(() => ctx.closeDialog(id), [ctx, id]);

  return { open, payload, openDialog, closeDialog } as const;
}

/**
 * DialogSlot — render-prop style slot for controlled dialogs.
 *
 * Usage:
 * <DialogSlot id="settings">{({ open, onOpenChange, payload, close }) => (
 *   <Dialog open={open} onOpenChange={onOpenChange}>...</Dialog>
 * )}</DialogSlot>
 */
export function DialogSlot({
  id,
  children
}: {
  id: string;
  children: (opts: {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    payload?: DialogPayload;
    close: () => void;
  }) => React.ReactNode;
}) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('DialogSlot must be used within a DialogProvider');

  const open = ctx.isOpen(id);
  const payload = ctx.getPayload(id);

  const onOpenChange = React.useCallback(
    (val: boolean) => {
      if (!val) ctx.closeDialog(id);
      else ctx.openDialog(id, payload);
    },
    [ctx, id, payload]
  );

  const close = React.useCallback(() => ctx.closeDialog(id), [ctx, id]);

  return <>{children({ open, onOpenChange, payload, close })}</>;
}

/**
 * ManagedDialog — convenience component that wires the project's `Dialog` wrapper
 * to the context. Accepts the same props as `Dialog` plus `id`.
 */
export function ManagedDialog({
  id,
  children,
  ...rest
}: {
  id: string;
  children: React.ReactNode;
} & React.ComponentProps<typeof RadixDialog>) {
  return (
    <DialogSlot id={id}>
      {({ open, onOpenChange }) => (
        <RadixDialog open={open} onOpenChange={onOpenChange} {...(rest as any)}>
          {children}
        </RadixDialog>
      )}
    </DialogSlot>
  );
}

export default DialogContext;
