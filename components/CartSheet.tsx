'use client';

import { useBookingStore } from '@/stores/useBookingStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IconShoppingCartFilled, IconTrash } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import dayjs from 'dayjs';

export default function CartSheet() {
  const bookingItems = useBookingStore((state) => state.bookingItems);
  const selectedCoaches = useBookingStore((state) => state.selectedCoaches);
  const selectedInventories = useBookingStore((state) => state.selectedInventories);
  const courtTotal = useBookingStore((state) => state.courtTotal);
  const coachTotal = useBookingStore((state) => state.coachTotal);
  const inventoryTotal = useBookingStore((state) => state.inventoryTotal);
  const getTotalAmount = useBookingStore((state) => state.getTotalAmount);
  const getTax = useBookingStore((state) => state.getTax);
  const getTotalWithTax = useBookingStore((state) => state.getTotalWithTax);
  const clearAll = useBookingStore((state) => state.clearAll);
  const isCartOpen = useBookingStore((state) => state.isCartOpen);
  const setCartOpen = useBookingStore((state) => state.setCartOpen);
  const removeBookingItem = useBookingStore((state) => state.removeBookingItem);

  // Group booking items by date
  const groupedBookings = useMemo(() => {
    const groups: Record<string, typeof bookingItems> = {};
    bookingItems.forEach((item) => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    });
    return groups;
  }, [bookingItems]);

  const getEndTime = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeSlot;

    const endHours = (hours + 1) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
      <SheetContent side="right" className="w-full overflow-y-auto sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Keranjang Booking</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 px-4">
          {/* COURT BOOKINGS - GROUPED BY DATE */}
          {bookingItems.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Booking Lapangan</h3>
              {Object.entries(groupedBookings).map(([date, items]) => (
                <div key={date} className="space-y-2">
                  {/* Date Header */}
                  <div className="bg-muted rounded-md px-3 py-2">
                    <p className="text-sm font-medium">
                      {dayjs(date, 'DD MMM').format('dddd, DD MMMM YYYY')}
                    </p>
                  </div>

                  {/* Slots for this date */}
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={`${item.courtId}-${item.timeSlot}-${idx}`}
                        className="hover:bg-muted/50 flex items-center justify-between gap-2 rounded-md border p-3 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.courtName}</p>
                          <p className="text-muted-foreground text-xs">
                            {item.timeSlot} - {getEndTime(item.timeSlot)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            Rp {item.price.toLocaleString('id-ID')}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            onClick={() =>
                              removeBookingItem(item.courtId, item.timeSlot, item.date)
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

              {/* Court Subtotal */}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Subtotal Lapangan</span>
                <span className="text-sm font-semibold">
                  Rp {courtTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <p className="text-sm">Belum ada booking lapangan</p>
            </div>
          )}

          <Separator />

          {/* COACH */}
          {selectedCoaches.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold">Coach</h3>
              <div className="space-y-2">
                {selectedCoaches.map((coach, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-md border p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{coach.coachName}</p>
                      <p className="text-muted-foreground text-xs">{coach.timeSlot}</p>
                    </div>
                    <span className="text-sm font-semibold">
                      Rp {coach.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Subtotal Coach</span>
                <span className="text-sm font-semibold">
                  Rp {coachTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {selectedCoaches.length > 0 && <Separator />}

          {/* INVENTORY */}
          {selectedInventories.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold">Peralatan</h3>
              <div className="space-y-2">
                {selectedInventories.map((inv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-md border p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{inv.inventoryName}</p>
                      <p className="text-muted-foreground text-xs">Quantity: {inv.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">
                      Rp {inv.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Subtotal Peralatan</span>
                <span className="text-sm font-semibold">
                  Rp {inventoryTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {selectedInventories.length > 0 && <Separator />}

          {/* TOTAL */}
          <div className="bg-muted/50 space-y-2 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">Rp {getTotalAmount().toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pajak (10%)</span>
              <span className="font-medium">Rp {getTax().toLocaleString('id-ID')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-base font-semibold">Total</span>
              <span className="text-primary text-lg font-bold">
                Rp {getTotalWithTax().toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="sticky bottom-0 space-y-2 bg-white pt-4 pb-2">
            <Button className="w-full" size="lg" disabled={bookingItems.length === 0}>
              Lanjut ke Pembayaran
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
