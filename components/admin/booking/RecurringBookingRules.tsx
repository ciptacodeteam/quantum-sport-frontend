'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import { ListRestart, ChevronRight, CalendarClock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Rule = {
  id: string;
  isActive: boolean;
  endDate: string | null;
  stoppedAt: string | null;
  weekdays: number[];
  templates: { courtName: string; time: string }[];
  user: { name: string; phone: string };
  occurrences: { date: string; reason: string }[];
};
const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function RecurringBookingRules() {
  const [open, setOpen] = useState(false);
  const [stopId, setStopId] = useState<string | null>(null);
  const client = useQueryClient();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['admin', 'recurring-bookings'],
    queryFn: async () => (await adminApi.get('/bookings/recurring')).data.data as Rule[],
    enabled: open,
    refetchInterval: open ? 60_000 : false
  });
  const rules: Rule[] = Array.isArray(data) ? data : [];
  const stop = useMutation({
    mutationFn: (id: string) => adminApi.put(`/bookings/recurring/${id}/stop`),
    onSuccess: () => {
      setStopId(null);
      client.invalidateQueries({ queryKey: ['admin', 'recurring-bookings'] });
      toast.success('Perpanjangan dihentikan. Booking yang sudah dibuat tetap berlaku.');
    },
    onError: () => toast.error('Aturan belum dapat dihentikan. Silakan coba lagi.')
  });
  return (
    <>
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-primary h-auto min-h-9 w-full min-w-0 justify-between gap-3 px-1 py-2 text-xs whitespace-normal hover:bg-transparent"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="flex items-center gap-2">
          <ListRestart className="size-4" />
          Kelola booking rutin
        </span>
        <ChevronRight className="size-3.5 shrink-0" />
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!stop.isPending) {
            setOpen(value);
            setStopId(null);
          }
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="gap-2 border-b pb-4">
            <DialogTitle className="flex items-center gap-3">
              <ListRestart className="text-primary size-5" />
              Kelola booking rutin
            </DialogTitle>
            <DialogDescription>
              Menampilkan 100 aturan terbaru. Menghentikan aturan hanya menghentikan penambahan
              jadwal; booking yang sudah terbentuk tetap berlaku dan dapat dibatalkan secara
              terpisah.
            </DialogDescription>
          </DialogHeader>
          {isPending && <p className="text-sm">Memuat aturan…</p>}
          {isError && (
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba muat ulang
            </Button>
          )}
          {!isPending && !isError && !rules.length && (
            <div className="bg-muted/20 flex flex-col items-center rounded-xl border border-dashed px-5 py-8 text-center">
              <CalendarClock className="text-muted-foreground/60 mb-3 size-8" />
              <p className="text-sm font-medium">Belum ada aturan booking rutin.</p>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">
                Pilih pelanggan dan jadwal awal di Booking Summary, lalu gunakan Ulangi mingguan.
              </p>
            </div>
          )}
          {rules.map((rule) => (
            <div key={rule.id} className="space-y-3 rounded-xl border p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{rule.user.name}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{rule.user.phone}</p>
                </div>
                <Badge variant={rule.isActive ? 'lightSuccess' : 'outline'}>
                  {rule.isActive ? 'Aktif' : rule.stoppedAt ? 'Dihentikan' : 'Jadwal lengkap'}
                </Badge>
              </div>
              <p>
                {rule.weekdays.map((day) => days[day]).join(', ')} ·{' '}
                {rule.templates.map((item) => `${item.courtName} ${item.time}`).join(', ')}
              </p>
              <p>
                {rule.isActive
                  ? 'Aktif'
                  : rule.stoppedAt
                    ? 'Dihentikan admin'
                    : 'Seluruh rentang sudah dibuat'}{' '}
                ·{' '}
                {rule.endDate
                  ? `Sampai ${rule.endDate.slice(0, 10)}`
                  : 'Mengikuti rolling tanpa tanggal berhenti'}
              </p>
              {rule.occurrences.map((item) => (
                <p key={item.date} className="text-xs text-amber-700">
                  {item.date.slice(0, 10)}: {item.reason}
                </p>
              ))}
              {rule.isActive &&
                (stopId === rule.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>Hentikan penambahan jadwal baru?</span>
                    <Button
                      size="sm"
                      disabled={stop.isPending}
                      onClick={() => stop.mutate(rule.id)}
                    >
                      Ya, hentikan
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={stop.isPending}
                      onClick={() => setStopId(null)}
                    >
                      Batal
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setStopId(rule.id)}>
                    Hentikan perpanjangan
                  </Button>
                ))}
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
