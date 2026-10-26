'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { useBookingStore } from '@/stores/useBookingStore';
import { useBranchStore } from '@/stores/useBranchStore';
import { IconShoppingCartFilled } from '@tabler/icons-react';
import { ArrowUpRight, CalendarDays, ShoppingCart, Trash2, X } from 'lucide-react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function CartSheet({ minimal = false }: { minimal?: boolean }) {
  const router = useRouter();

  const bookingItems = useBookingStore((state) => state.bookingItems);
  const selectedCoaches = useBookingStore((state) => state.selectedCoaches);
  const selectedInventories = useBookingStore((state) => state.selectedInventories);
  // const courtTotal = useBookingStore((state) => state.courtTotal);
  const coachTotal = useBookingStore((state) => state.coachTotal);
  const inventoryTotal = useBookingStore((state) => state.inventoryTotal);
  const getTotalAmount = useBookingStore((state) => state.getTotalAmount);
  const clearAll = useBookingStore((state) => state.clearAll);
  const isCartOpen = useBookingStore((state) => state.isCartOpen);
  const setCartOpen = useBookingStore((state) => state.setCartOpen);
  const removeBookingItem = useBookingStore((state) => state.removeBookingItem);
  const removeInventory = useBookingStore((state) => state.removeInventory);

  const hasCartItems =
    bookingItems.length > 0 || selectedInventories.length > 0 || selectedCoaches.length > 0;
  const cartItemCount =
    bookingItems.length +
    selectedCoaches.length +
    selectedInventories.reduce((total, item) => total + item.quantity, 0);

  // Group booking items by date
  const groupedBookings = useMemo(() => {
    const map = new Map<string, typeof bookingItems>();

    bookingItems.forEach((item) => {
      const iso = dayjs(item.date, 'YYYY-MM-DD', true);
      const fallback = dayjs(item.date, 'DD MMM', true);

      let dateKey: string;
      if (iso.isValid()) {
        dateKey = iso.format('YYYY-MM-DD');
      } else if (fallback.isValid()) {
        dateKey = fallback.year(dayjs().year()).format('YYYY-MM-DD');
      } else {
        const parsed = dayjs(item.date);
        dateKey = parsed.isValid() ? parsed.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      }

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(item);
    });

    return Array.from(map.entries()).sort((a, b) => dayjs(a[0]).valueOf() - dayjs(b[0]).valueOf());
  }, [bookingItems]);

  const getEndTime = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeSlot;

    const endHours = (hours + 1) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // handle to route to add-ons page
  const handleCheckout = () => {
    router.push('/checkout');
    setCartOpen(false);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size={minimal ? 'icon' : 'icon-sm'}
          aria-label="Buka keranjang booking"
          className={minimal ? 'rounded-none text-black hover:bg-black/5' : undefined}
        >
          <div className="flex-center relative">
            {minimal ? (
              <ShoppingCart className="size-5" strokeWidth={1.5} />
            ) : (
              <IconShoppingCartFilled className="text-primary size-7" />
            )}
            {cartItemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full border-transparent bg-[#ad422b] px-1 font-mono text-white tabular-nums">
                {cartItemCount}
              </Badge>
            )}
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        withClose={false}
        className="h-dvh max-h-dvh w-full gap-0 overflow-hidden border-black/15 bg-[#f8f8f6] text-[#171717] sm:w-[480px] sm:max-w-[480px]"
      >
        <SheetHeader className="shrink-0 border-b border-black/15 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="text-2xl font-medium tracking-tight">Keranjang</SheetTitle>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              aria-label="Tutup keranjang"
              className="flex size-10 shrink-0 items-center justify-center border border-black/15 bg-transparent text-black/55 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-2 focus-visible:outline-[#ad422b]"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
          <SheetDescription className="text-xs leading-relaxed text-black/50">
            Periksa jadwal dan perlengkapan sebelum melanjutkan.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
          <div className="space-y-6">
            {groupedBookings.length > 0 ? (
              <section aria-labelledby="cart-courts-title">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3
                    id="cart-courts-title"
                    className="text-[10px] font-medium tracking-[0.14em] text-[#ad422b] uppercase"
                  >
                    Lapangan
                  </h3>
                  <span className="text-[11px] text-black/45">{bookingItems.length} slot</span>
                </div>
                <div className="space-y-3">
                  {groupedBookings.map(([date, items]) => (
                    <div key={date} className="border border-black/15 bg-white">
                      <div className="flex items-center gap-2 border-b border-black/10 bg-[#f8f8f6] px-4 py-3">
                        <CalendarDays
                          className="size-3.5 shrink-0 text-[#ad422b]"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                        <h4 className="text-xs font-medium">
                          {dayjs(date).format('dddd, DD MMM YYYY')}
                        </h4>
                      </div>
                      <ul className="divide-y divide-black/10 px-4">
                        {[...items]
                          .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                          .map((item, index) => (
                            <li
                              key={`${item.courtId}-${item.timeSlot}-${index}`}
                              className="flex items-center justify-between gap-3 py-4"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium break-words">{item.courtName}</p>
                                <p className="mt-1 text-xs text-black/50">
                                  {item.timeSlot}–{item.endTime || getEndTime(item.timeSlot)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-sm font-medium whitespace-nowrap text-[#ad422b] tabular-nums">
                                  Rp{item.price.toLocaleString('id-ID')}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Hapus ${item.courtName}, ${item.timeSlot}, ${dayjs(date).format('DD MMM YYYY')}`}
                                  onClick={() =>
                                    removeBookingItem(item.courtId, item.timeSlot, date)
                                  }
                                  className="flex size-9 items-center justify-center text-black/35 transition-colors hover:bg-[#ad422b]/5 hover:text-[#ad422b] focus-visible:outline-2 focus-visible:outline-[#ad422b]"
                                >
                                  <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                                </button>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : !hasCartItems ? (
              <section className="flex min-h-64 flex-col items-center justify-center border border-dashed border-black/20 px-5 py-8 text-center">
                <ShoppingCart
                  className="mb-4 size-10 text-black/25"
                  strokeWidth={1}
                  aria-hidden="true"
                />
                <h3 className="text-lg font-medium tracking-tight">Jadwal Anda masih kosong</h3>
                <p className="mt-2 max-w-60 text-xs leading-relaxed text-black/50">
                  Pilih lapangan dan waktu bermain untuk memulai pemesanan.
                </p>
                <Button
                  variant="outline"
                  className="mt-8 h-11 gap-3 rounded-full border-black/20 bg-transparent px-6 text-xs shadow-none hover:bg-black/5 has-[>svg]:px-6"
                  onClick={() => {
                    useBranchStore.getState().openSelector('/booking');
                    setCartOpen(false);
                  }}
                >
                  Pilih jadwal <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Button>
              </section>
            ) : null}

            {selectedCoaches.length > 0 && (
              <section aria-labelledby="cart-coaches-title">
                <h3
                  id="cart-coaches-title"
                  className="mb-3 text-[10px] font-medium tracking-[0.14em] text-[#ad422b] uppercase"
                >
                  Coach
                </h3>
                <ul className="divide-y divide-black/10 border border-black/15 bg-white px-4">
                  {selectedCoaches.map((coach, index) => (
                    <li key={index} className="flex items-start justify-between gap-3 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words">{coach.coachName}</p>
                        <p className="mt-1 text-xs text-black/50">{coach.timeSlot}</p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-[#ad422b] tabular-nums">
                        Rp{coach.price.toLocaleString('id-ID')}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between gap-3 text-xs">
                  <span className="text-black/45">Subtotal coach</span>
                  <span className="font-medium">Rp{coachTotal.toLocaleString('id-ID')}</span>
                </div>
              </section>
            )}

            {selectedInventories.length > 0 && (
              <section aria-labelledby="cart-equipment-title">
                <h3
                  id="cart-equipment-title"
                  className="mb-3 text-[10px] font-medium tracking-[0.14em] text-[#ad422b] uppercase"
                >
                  Peralatan
                </h3>
                <ul className="divide-y divide-black/10 border border-black/15 bg-white px-4">
                  {selectedInventories.map((item) => (
                    <li
                      key={`${item.inventoryId}-${item.timeSlot ?? 'default'}`}
                      className="flex items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words">{item.inventoryName}</p>
                        <p className="mt-1 text-xs text-black/50">Jumlah: {item.quantity}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium whitespace-nowrap text-[#ad422b] tabular-nums">
                          Rp{item.price.toLocaleString('id-ID')}
                        </span>
                        <button
                          type="button"
                          aria-label={`Hapus ${item.inventoryName}`}
                          onClick={() =>
                            removeInventory(item.inventoryId, item.timeSlot ?? 'default')
                          }
                          className="flex size-9 items-center justify-center text-black/35 transition-colors hover:bg-[#ad422b]/5 hover:text-[#ad422b] focus-visible:outline-2 focus-visible:outline-[#ad422b]"
                        >
                          <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between gap-3 text-xs">
                  <span className="text-black/45">Subtotal peralatan</span>
                  <span className="font-medium">Rp{inventoryTotal.toLocaleString('id-ID')}</span>
                </div>
              </section>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-black/15 bg-[#f8f8f6] px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-7">
          <div className="mb-5 flex items-end justify-between gap-4">
            <span className="text-xs text-black/50">Subtotal</span>
            <p className="text-2xl font-medium tracking-tight tabular-nums">
              Rp{getTotalAmount().toLocaleString('id-ID')}
            </p>
          </div>
          <div className="grid auto-cols-fr grid-flow-col gap-3">
            {(bookingItems.length > 0 ||
              selectedCoaches.length > 0 ||
              selectedInventories.length > 0) && (
              <Button
                variant="outline"
                className="h-12 w-full rounded-full border-black/20 bg-transparent px-3 text-xs shadow-none hover:bg-black/5"
                onClick={clearAll}
              >
                Hapus semua
              </Button>
            )}
            <Button
              className="h-12 w-full rounded-full bg-[#111111] px-3 text-xs text-white hover:bg-black/80 disabled:bg-black/15 disabled:text-black/40 disabled:opacity-100"
              disabled={bookingItems.length === 0 && selectedInventories.length === 0}
              onClick={handleCheckout}
            >
              Checkout <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
