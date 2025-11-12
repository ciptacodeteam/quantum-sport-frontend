'use client';

import { useBookingStore } from '@/stores/useBookingStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { IconShoppingCartFilled, IconTrash } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { IconX } from '@tabler/icons-react';

export default function CartSheet() {
  const router = useRouter();

  const bookingItems = useBookingStore((state) => state.bookingItems);
  const selectedCoaches = useBookingStore((state) => state.selectedCoaches);
  const selectedInventories = useBookingStore((state) => state.selectedInventories);
  const courtTotal = useBookingStore((state) => state.courtTotal);
  const coachTotal = useBookingStore((state) => state.coachTotal);
  const inventoryTotal = useBookingStore((state) => state.inventoryTotal);
  const getTotalAmount = useBookingStore((state) => state.getTotalAmount);
  const clearAll = useBookingStore((state) => state.clearAll);
  const isCartOpen = useBookingStore((state) => state.isCartOpen);
  const setCartOpen = useBookingStore((state) => state.setCartOpen);
  const removeBookingItem = useBookingStore((state) => state.removeBookingItem);

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
        <Button variant={'ghost'} size={'icon-sm'}>
          <div className="flex-center relative">
            <IconShoppingCartFilled className="text-primary size-7" />
            {bookingItems.length > 0 && (
              <Badge className="bg-badge absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
                {bookingItems.length}
              </Badge>
            )}
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden bg-white sm:w-[420px] [&>button]:hidden"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="flex flex-row items-center justify-between px-5 border border-b py-7 mb-4">
            <SheetTitle className="text-xl text-primary font-semibold">Keranjang Booking</SheetTitle>
            <button
              onClick={() => setCartOpen(false)}
              className="text-muted-foreground hover:text-foreground transition"
            >
              ✕
            </button>
          </SheetHeader>
          <div className="mx-auto w-11/12 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {/* COURT BOOKINGS - GROUPED BY DATE */}
              {groupedBookings.length > 0 ? (
                <section className="space-y-4">
                  {/* <h3 className="font-semibold text-base">Booking Lapangan</h3> */}
                  <div className="space-y-4">
                    {groupedBookings.map(([date, items]) => (
                      <div
                        key={date}
                        className="border-muted space-y-3 rounded-lg border bg-white px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-primary text-sm font-semibold">
                            {dayjs(date).format('dddd, DD MMMM YYYY')}
                          </p>
                          <span className="text-muted-foreground text-xs font-medium">
                            {items.length} Slot
                          </span>
                        </div>

                        <div className="space-y-3">
                          {[...items]
                            .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                            .map((item, idx) => (
                              <div
                                key={`${item.courtId}-${item.timeSlot}-${idx}`}
                                className="border-muted/70 flex items-start justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-medium">{item.courtName}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {item.timeSlot} - {getEndTime(item.timeSlot)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold whitespace-nowrap">
                                    Rp{item.price.toLocaleString('id-ID')}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                    onClick={() =>
                                      removeBookingItem(item.courtId, item.timeSlot, date)
                                    }
                                  >
                                    <IconTrash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* <div className="border-muted flex items-center justify-between border-t border-dashed text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal Lapangan</span>
                    <span className="font-semibold">Rp {courtTotal.toLocaleString('id-ID')}</span>
                  </div> */}
                </section>
              ) : (
                <section className="border-muted/60 bg-muted/30 text-muted-foreground flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
                  <IconShoppingCartFilled className="text-muted-foreground/70 mb-3 size-12" />
                  <p className="text-sm font-medium">Belum ada booking lapangan</p>
                </section>
              )}

              {/* COACH */}
              {selectedCoaches.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Coach</h3>
                  <div className="space-y-3">
                    {selectedCoaches.map((coach, idx) => (
                      <div
                        key={idx}
                        className="border-muted/70 flex items-start justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{coach.coachName}</p>
                          <p className="text-muted-foreground text-xs">{coach.timeSlot}</p>
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap">
                          Rp {coach.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-muted flex items-center justify-between border-t border-dashed pt-3 text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal Coach</span>
                    <span className="font-semibold">Rp {coachTotal.toLocaleString('id-ID')}</span>
                  </div>
                </section>
              )}

              {/* INVENTORY */}
              {selectedInventories.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Peralatan</h3>
                  <div className="space-y-3">
                    {selectedInventories.map((inv, idx) => (
                      <div
                        key={idx}
                        className="border-muted/70 flex items-start justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{inv.inventoryName}</p>
                          <p className="text-muted-foreground text-xs">Quantity: {inv.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap">
                          Rp {inv.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-muted flex items-center justify-between border-t border-dashed pt-3 text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal Peralatan</span>
                    <span className="font-semibold">
                      Rp {inventoryTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </section>
              )}

              {/* TOTAL */}
              <section className="border-muted/70 bg-muted/20 space-y-2 rounded-lg border px-4 py-4 mb-4">
                <div className="text-muted-foreground flex justify-between text-sm">
                  <span>Sub total</span>
                  <span className="text-foreground text-base font-semibold">
                    Rp{getTotalAmount().toLocaleString('id-ID')}
                  </span>
                </div>
              </section>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-200 bg-white px-4 py-4">
            <Button
              className="w-full"
              size="lg"
              disabled={bookingItems.length === 0}
              onClick={handleCheckout}
            >
              Lanjut ke Checkout
            </Button>
            {(bookingItems.length > 0 ||
              selectedCoaches.length > 0 ||
              selectedInventories.length > 0) && (
              <Button variant="outline" className="w-full" onClick={clearAll}>
                Hapus Semua
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
