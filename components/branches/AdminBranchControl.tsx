'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminBranches } from '@/api/branch';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { useBranchStore } from '@/stores/useBranchStore';
import { useBookingStore } from '@/stores/useBookingStore';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminBranchControl() {
  const { data: user } = useQuery(adminProfileQueryOptions);
  const { data: branches } = useQuery({
    queryKey: ['admin', 'branches'],
    queryFn: getAdminBranches,
    enabled: !!user
  });
  const selected = useBranchStore((state) => state.adminBranchId);
  const [pending, setPending] = useState<string | undefined>();
  const [switching, setSwitching] = useState(false);
  const queryClient = useQueryClient();
  if (!user) return null;
  if (user.role !== 'SUPER_ADMIN')
    return (
      <p className="max-w-48 text-xs font-medium">
        {user.branch?.name || 'Cabang belum ditetapkan'}
      </p>
    );
  const changeBranch = async (id: string) => {
    const cart = useBookingStore.getState();
    if (
      pending === undefined &&
      (cart.bookingItems.length ||
        cart.selectedCoaches.length ||
        cart.selectedBallboys.length ||
        cart.selectedInventories.length)
    ) {
      setPending(id);
      return;
    }
    setSwitching(true);
    await queryClient.cancelQueries();
    cart.clearAll();
    useBranchStore.getState().setAdminBranchId(id || null);
    queryClient.clear();
    window.location.assign('/admin/dashboard');
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="admin-branch" className="sr-only">
        Cabang dashboard
      </label>
      <select
        id="admin-branch"
        value={selected || ''}
        disabled={switching}
        onChange={(event) => void changeBranch(event.target.value)}
        className="h-9 max-w-48 border border-black/15 bg-white px-2 text-xs"
      >
        <option value="">Semua cabang</option>
        {branches?.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
            {branch.isActive ? '' : ' (nonaktif)'}
          </option>
        ))}
      </select>
      <Link href="/admin/cabang" className="text-xs text-[#ad422b] underline">
        Kelola cabang
      </Link>
      {pending !== undefined && (
        <div
          role="alertdialog"
          aria-label="Konfirmasi pindah cabang"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
        >
          <div className="max-w-md border border-black/15 bg-white p-6">
            <h2 className="font-medium">Pindah cabang?</h2>
            <p className="mt-2 text-sm text-black/55">
              Keranjang booking saat ini akan dikosongkan.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={switching}
                onClick={() => void changeBranch(pending)}
                className="bg-black px-4 py-2 text-sm text-white"
              >
                Pindah cabang
              </button>
              <button
                type="button"
                disabled={switching}
                onClick={() => setPending(undefined)}
                className="border px-4 py-2 text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
