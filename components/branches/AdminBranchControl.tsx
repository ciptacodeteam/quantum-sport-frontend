'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminBranches } from '@/api/branch';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { useBranchStore } from '@/stores/useBranchStore';
import { useBookingStore } from '@/stores/useBookingStore';
import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Settings2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

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
    <div className="min-w-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={switching}
            aria-label="Cabang dashboard"
            className="h-10 max-w-[calc(100vw-160px)] gap-2 rounded-lg px-3 shadow-none sm:max-w-[240px]"
          >
            <MapPin className="text-muted-foreground size-4" />
            <span className="truncate">
              {switching
                ? 'Memindahkan cabang...'
                : selected
                  ? branches?.find((branch) => branch.id === selected)?.name ||
                    user.branch?.name ||
                    'Pilih cabang'
                  : 'Semua cabang'}
            </span>
            <ChevronDown className="text-muted-foreground ml-1 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="w-72 max-w-[calc(100vw-24px)] rounded-xl p-2 shadow-lg"
        >
          <DropdownMenuLabel className="text-muted-foreground px-3 py-2 text-xs font-medium">
            Pilih cabang
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={selected || ''}
            onValueChange={(value) => {
              if (value !== (selected || '')) void changeBranch(value);
            }}
          >
            <DropdownMenuRadioItem
              value=""
              className="data-[state=checked]:bg-muted rounded-lg py-3 pr-3"
            >
              <div className="space-y-1">
                <p className="font-medium">Semua cabang</p>
                <p className="text-muted-foreground text-xs">Ringkasan seluruh lokasi</p>
              </div>
            </DropdownMenuRadioItem>
            <div className="max-h-64 overflow-y-auto">
              {branches?.map((branch) => (
                <DropdownMenuRadioItem
                  key={branch.id}
                  value={branch.id}
                  className="data-[state=checked]:bg-muted rounded-lg py-3 pr-3"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium break-words">{branch.name}</span>
                    {!branch.isActive && (
                      <span className="text-muted-foreground text-xs">Nonaktif</span>
                    )}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </div>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem asChild className="gap-2 rounded-lg px-3 py-2.5">
            <Link href="/admin/cabang">
              <Settings2 className="size-4 text-white" />
              Kelola cabang
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
                data-slot="button"
                data-variant="default"
                type="button"
                disabled={switching}
                onClick={() => void changeBranch(pending)}
                className="bg-primary px-4 py-2 text-sm text-white"
              >
                Pindah cabang
              </button>
              <button
                data-slot="button"
                data-variant="outline"
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
