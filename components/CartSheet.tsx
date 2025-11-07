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
  const bookingItems = useBookingStore(state => state.bookingItems)
  const selectedCoaches = useBookingStore(state => state.selectedCoaches)
  const selectedInventories = useBookingStore(state => state.selectedInventories)
  const courtTotal = useBookingStore(state => state.courtTotal)
  const coachTotal = useBookingStore(state => state.coachTotal)
  const inventoryTotal = useBookingStore(state => state.inventoryTotal)
  const getTotalAmount = useBookingStore(state => state.getTotalAmount)
  const getTax = useBookingStore(state => state.getTax)
  const getTotalWithTax = useBookingStore(state => state.getTotalWithTax)
  const clearAll = useBookingStore(state => state.clearAll)
  const isCartOpen = useBookingStore(state => state.isCartOpen)
  const setCartOpen = useBookingStore(state => state.setCartOpen)
  const removeBookingItem = useBookingStore(state => state.removeBookingItem)
  
  // Group booking items by date
  const groupedBookings = useMemo(() => {
    const groups: Record<string, typeof bookingItems> = {};
    bookingItems.forEach(item => {
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
      <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Keranjang Booking</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* COURT BOOKINGS - GROUPED BY DATE */}
          {bookingItems.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-base">Booking Lapangan</h3>
              {Object.entries(groupedBookings).map(([date, items]) => (
                <div key={date} className="space-y-2">
                  {/* Date Header */}
                  <div className="bg-muted px-3 py-2 rounded-md">
                    <p className="font-medium text-sm">
                      {dayjs(date, 'DD MMM').format('dddd, DD MMMM YYYY')}
                    </p>
                  </div>
                  
                  {/* Slots for this date */}
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div 
                        key={`${item.courtId}-${item.timeSlot}-${idx}`} 
                        className="flex items-center justify-between gap-2 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.courtName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.timeSlot} - {getEndTime(item.timeSlot)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            Rp {item.price.toLocaleString('id-ID')}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeBookingItem(item.courtId, item.timeSlot, item.date)}
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
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Subtotal Lapangan</span>
                <span className="text-sm font-semibold">Rp {courtTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Belum ada booking lapangan</p>
            </div>
          )}

          <Separator />

          {/* COACH */}
          {selectedCoaches.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Coach</h3>
              <div className="space-y-2">
                {selectedCoaches.map((coach, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between gap-2 p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{coach.coachName}</p>
                      <p className="text-xs text-muted-foreground">{coach.timeSlot}</p>
                    </div>
                    <span className="font-semibold text-sm">
                      Rp {coach.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Subtotal Coach</span>
                <span className="text-sm font-semibold">Rp {coachTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {selectedCoaches.length > 0 && <Separator />}

          {/* INVENTORY */}
          {selectedInventories.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Peralatan</h3>
              <div className="space-y-2">
                {selectedInventories.map((inv, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between gap-2 p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{inv.inventoryName}</p>
                      <p className="text-xs text-muted-foreground">Quantity: {inv.quantity}</p>
                    </div>
                    <span className="font-semibold text-sm">
                      Rp {inv.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Subtotal Peralatan</span>
                <span className="text-sm font-semibold">Rp {inventoryTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {selectedInventories.length > 0 && <Separator />}

          {/* TOTAL */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
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
              <span className="font-semibold text-base">Total</span>
              <span className="font-bold text-lg text-primary">
                Rp {getTotalWithTax().toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 space-y-2">
            <Button className="w-full" size="lg" disabled={bookingItems.length === 0}>
              Lanjut ke Pembayaran
            </Button>
            {(bookingItems.length > 0 || selectedCoaches.length > 0 || selectedInventories.length > 0) && (
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
