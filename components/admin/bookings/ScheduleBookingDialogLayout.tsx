'use client';

import type { ReactNode } from 'react';
import { CalendarClock, ListChecks, Plus } from 'lucide-react';
import type { Booking } from '@/types/model';
import { BookingStatus, BOOKING_STATUS_BADGE_VARIANT, BOOKING_STATUS_MAP } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  useDialog
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CancelBookingDialog from './CancelBookingDialog';

export default function ScheduleBookingDialogLayout({
  booking,
  status,
  dialogId,
  summary,
  manageSchedule,
  addServices,
  children
}: {
  booking: Booking;
  status: BookingStatus;
  dialogId: string;
  summary: ReactNode;
  manageSchedule: ReactNode;
  addServices: ReactNode;
  children: ReactNode;
}) {
  const { closeDialog } = useDialog();
  const active = status !== BookingStatus.CANCELLED;
  return (
    <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-2rem)] max-w-[1200px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1200px]">
      <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <DialogTitle className="text-foreground text-xl">Detail pemesanan</DialogTitle>
          <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>{BOOKING_STATUS_MAP[status]}</Badge>
        </div>
        <DialogDescription>
          Periksa ringkasan, kelola jadwal, atau tambahkan layanan melalui tab di bawah.
        </DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid items-start gap-5 p-5 sm:p-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            aria-label="Ringkasan pemesanan"
            className="bg-muted/20 min-w-0 space-y-4 rounded-xl border p-4"
          >
            <h3 className="text-sm font-semibold">Ringkasan pemesanan</h3>
            {summary}
          </aside>
          <Tabs defaultValue="overview" className="min-w-0 gap-4">
            <TabsList
              aria-label="Kelola pemesanan"
              className="bg-muted/40 grid h-auto w-full grid-cols-3 gap-1 p-1"
            >
              <TabsTrigger
                value="overview"
                className="min-w-0 gap-1.5 px-2 py-2.5 text-xs sm:text-sm"
              >
                <ListChecks className="hidden size-4 sm:block" />
                Jadwal & layanan
              </TabsTrigger>
              {active && (
                <>
                  <TabsTrigger
                    value="schedule"
                    className="min-w-0 gap-1.5 px-2 py-2.5 text-xs sm:text-sm"
                  >
                    <CalendarClock className="hidden size-4 sm:block" />
                    Ubah jadwal
                  </TabsTrigger>
                  <TabsTrigger
                    value="services"
                    className="min-w-0 gap-1.5 px-2 py-2.5 text-xs sm:text-sm"
                  >
                    <Plus className="hidden size-4 sm:block" />
                    Tambah layanan
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            <TabsContent value="overview" className="m-0 space-y-4">
              {children}
            </TabsContent>
            {active && (
              <>
                <TabsContent value="schedule" className="m-0 space-y-4">
                  <div>
                    <h3 className="font-semibold">Ubah jadwal bermain</h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Pindahkan lapangan atau ubah tanggal dan jam untuk slot yang dibuka.
                    </p>
                  </div>
                  {manageSchedule}
                </TabsContent>
                <TabsContent value="services" className="m-0 space-y-4">
                  <div>
                    <h3 className="font-semibold">Tambah coach atau ballboy</h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Pilih layanan untuk slot ini, lalu pilih metode pembayaran untuk konfirmasi.
                    </p>
                  </div>
                  {addServices}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
      <footer className="bg-background flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
        <div>
          <p className="text-muted-foreground text-xs">Total tagihan</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            Rp{' '}
            {new Intl.NumberFormat('id-ID').format(
              booking.totalPrice + (booking.processingFee || 0)
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {active && (
            <CancelBookingDialog booking={booking} onCancelled={() => closeDialog(dialogId)} />
          )}
          <DialogClose asChild>
            <Button variant="outline">Tutup</Button>
          </DialogClose>
        </div>
      </footer>
    </DialogContent>
  );
}
