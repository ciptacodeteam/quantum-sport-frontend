'use client';

import { useBookingStore } from '@/stores/useBookingStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IconShoppingCartFilled } from '@tabler/icons-react';
import { Badge } from 'lucide-react';

export default function CartSheet() {
  const {
    bookingItems,
    selectedCoaches,
    selectedInventories,
    courtTotal,
    coachTotal,
    inventoryTotal,
    getTotalAmount,
    getTax,
    getTotalWithTax,
    clearAll,
  } = useBookingStore();


  console.log("booking",bookingItems.length)
  return (
    <Sheet>
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
          {/* COURT */}
          {bookingItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Court</h3>
              <div className="space-y-2">
                {bookingItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.courtName} ({item.timeSlot})</span>
                    <span>Rp {item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm font-medium mt-1">Subtotal: Rp {courtTotal.toLocaleString()}</div>
            </div>
          )}

          <Separator />

          {/* COACH */}
          {selectedCoaches.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Coach</h3>
              <div className="space-y-2">
                {selectedCoaches.map((coach, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{coach.coachName} ({coach.timeSlot})</span>
                    <span>Rp {coach.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm font-medium mt-1">Subtotal: Rp {coachTotal.toLocaleString()}</div>
            </div>
          )}

          <Separator />

          {/* INVENTORY */}
          {selectedInventories.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Peralatan</h3>
              <div className="space-y-2">
                {selectedInventories.map((inv, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{inv.inventoryName} × {inv.quantity}</span>
                    <span>Rp {inv.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm font-medium mt-1">Subtotal: Rp {inventoryTotal.toLocaleString()}</div>
            </div>
          )}

          <Separator />

          {/* TOTAL */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {getTotalAmount().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak (10%)</span>
              <span>Rp {getTax().toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>Rp {getTotalWithTax().toLocaleString()}</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-4 flex gap-2">
            <Button className="w-full">Lanjut ke Pembayaran</Button>
            <Button variant="outline" className="w-full" onClick={clearAll}>
              Hapus Semua
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
