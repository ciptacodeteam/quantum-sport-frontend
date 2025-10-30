'use client';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { IconShoppingCartFilled } from '@tabler/icons-react';
import { ChevronLeft } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const CartSheet = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={'ghost'} size={'icon-sm'}>
          <div className="flex-center relative">
            <IconShoppingCartFilled className="text-primary size-7" />
            <Badge className="bg-badge absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
              3
            </Badge>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full" withClose={false}>
        <SheetHeader className="flex min-h-20 flex-row items-center justify-start gap-4 border-b">
          <SheetClose asChild>
            <Button variant="light" size="icon-sm">
              <ChevronLeft className="size-6" />
            </Button>
          </SheetClose>
          <SheetTitle className="text-lg font-semibold">Keranjang Saya</SheetTitle>
        </SheetHeader>
        <main className="p-4 py-2">
          <p>Cart content goes here.</p>
        </main>
        <SheetFooter>
          <Button type="submit" size={'xl'}>
            Lanjutkan ke Pembayaran
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
export default CartSheet;
