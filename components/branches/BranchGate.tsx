'use client';

import { Fragment, useEffect, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBranches } from '@/api/branch';
import { useBranchStore } from '@/stores/useBranchStore';
import { useBookingStore } from '@/stores/useBookingStore';
import type { Branch } from '@/types/branch';

export default function BranchGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const requiresBranch =
    /^\/(booking|membership|add-ons|checkout)(\/|$)/.test(pathname) &&
    pathname !== '/checkout/3ds-challenge';
  const { branch, selectorOpen, pendingHref, setBranch, closeSelector } = useBranchStore();
  const [ready, setReady] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pendingBranch, setPendingBranch] = useState<Branch | null>(null);
  const [switching, setSwitching] = useState(false);
  const queryClient = useQueryClient();
  const {
    data: branches,
    isError,
    refetch
  } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: requiresBranch || selectorOpen,
    staleTime: 60000
  });
  useEffect(() => {
    const current = useBranchStore.getState().branch;
    setConfirmed(!!current && sessionStorage.getItem('confirmed-branch') === current.id);
    setReady(true);
  }, []);
  useEffect(() => {
    setSwitching(false);
  }, [pathname]);
  const validBranch = branches?.find((item) => item.id === branch?.id);
  if (!ready && requiresBranch) return <div className="min-h-dvh bg-white" />;

  const choose = async (next: Branch, discardCart = false) => {
    const cart = useBookingStore.getState();
    const hasCart = !!(
      cart.bookingItems.length ||
      cart.selectedCoaches.length ||
      cart.selectedBallboys.length ||
      cart.selectedInventories.length
    );
    if (next.id !== branch?.id && hasCart && !discardCart) {
      setPendingBranch(next);
      return;
    }
    const destination = pendingHref || (selectorOpen ? '/' : pathname);
    setSwitching(true);
    if (next.id !== branch?.id) {
      await queryClient.cancelQueries();
      cart.clearAll();
      // No query or payment selection from the previous branch may survive a switch.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'branches' });
      for (const key of ['checkoutData', 'checkout-selected-payment', 'payment_3ds_data'])
        sessionStorage.removeItem(key);
    }
    setBranch(next);
    sessionStorage.setItem('confirmed-branch', next.id);
    setConfirmed(true);
    setPendingBranch(null);
    if (destination !== pathname) router.push(destination);
    else setSwitching(false);
  };
  const canDismiss = !switching;
  const dialogOpen =
    !switching && (selectorOpen || (requiresBranch && (!confirmed || !validBranch)));
  const dismiss = () => {
    closeSelector();
    setPendingBranch(null);
    if (requiresBranch && (!confirmed || !validBranch)) router.replace('/');
  };
  return (
    <>
      <Fragment key={branch?.id || 'no-branch'}>
        {!requiresBranch || (!switching && confirmed && validBranch) ? (
          children
        ) : (
          <div className="min-h-dvh bg-[#f8f8f6]" />
        )}
      </Fragment>
      <Dialog.Root
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && canDismiss) {
            dismiss();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content
            aria-modal="true"
            className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-none border border-black/15 bg-white p-6 text-[#171717] shadow-lg outline-none sm:p-8"
            onEscapeKeyDown={(event) => {
              if (!canDismiss) event.preventDefault();
            }}
            onInteractOutside={(event) => {
              if (!canDismiss) event.preventDefault();
            }}
          >
            <p className="mb-5 text-xs font-medium tracking-[0.2em] uppercase">Black Padel</p>
            <Dialog.Title className="text-2xl font-medium tracking-tight sm:text-3xl">
              {pendingBranch ? 'Pindah cabang?' : 'Pilih cabang Anda'}
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm leading-relaxed text-black/55">
              {pendingBranch
                ? 'Keranjang saat ini akan dikosongkan saat Anda pindah cabang. Booking yang sudah dibuat tetap tersimpan di riwayat.'
                : 'Pilih lokasi bermain Anda untuk melanjutkan booking atau memilih Value Pack.'}
            </Dialog.Description>
            {pendingBranch ? (
              <div className="mt-7">
                <p className="font-medium">{pendingBranch.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-black/50">
                  {pendingBranch.address}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => void choose(pendingBranch, true)}
                    className="border border-[#111] bg-[#111] px-5 py-3 text-sm text-white disabled:opacity-50"
                  >
                    Kosongkan keranjang & pindah
                  </button>
                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => setPendingBranch(null)}
                    className="border border-black/20 px-5 py-3 text-sm"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-7 space-y-3">
                {isError ? (
                  <div role="alert" className="border border-black/15 p-5 text-sm">
                    <p>Cabang belum dapat dimuat.</p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-3 text-[#ad422b] underline"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : !branches ? (
                  <p role="status" className="py-5 text-sm text-black/50">
                    Memuat cabang…
                  </p>
                ) : !branches.length ? (
                  <p className="text-sm text-black/50">Belum ada cabang yang tersedia.</p>
                ) : (
                  branches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={switching}
                      onClick={() => void choose(item)}
                      className="block w-full border border-black/15 p-5 text-left transition-colors hover:border-[#ad422b] hover:bg-[#f8f8f6] focus-visible:outline-2 focus-visible:outline-[#ad422b] disabled:opacity-50"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-base font-medium">{item.name}</span>
                        {item.id === branch?.id && (
                          <span className="text-xs text-[#ad422b]">Pilihan terakhir</span>
                        )}
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-black/50">
                        {item.address}
                      </span>
                      <span className="mt-4 block text-xs font-medium text-[#ad422b]">
                        {item.id === branch?.id ? 'Lanjut di cabang ini' : 'Pilih cabang'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
            {!pendingBranch && (
              <button
                type="button"
                onClick={dismiss}
                className="mt-6 text-sm text-black/55 underline"
              >
                Batal
              </button>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
