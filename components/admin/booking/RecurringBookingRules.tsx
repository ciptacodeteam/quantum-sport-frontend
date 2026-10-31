'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
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
    <div className="space-y-3 rounded border p-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        Kelola booking rutin membership
      </Button>
      {open && (
        <>
          <p className="text-muted-foreground text-xs">
            Menampilkan 100 aturan terbaru. Menghentikan aturan hanya menghentikan penambahan
            jadwal; booking yang sudah terbentuk tetap berlaku dan dapat dibatalkan secara terpisah.
          </p>
          {isPending && <p className="text-sm">Memuat aturan…</p>}
          {isError && (
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba muat ulang
            </Button>
          )}
          {!isPending && !isError && !rules.length && (
            <p className="text-sm">Belum ada aturan booking rutin.</p>
          )}
          {rules.map((rule) => (
            <div key={rule.id} className="space-y-2 border-t pt-3 text-sm">
              <p className="font-medium">
                {rule.user.name} · {rule.user.phone}
              </p>
              <p>
                {rule.weekdays.map((day) => days[day]).join(', ')} ·{' '}
                {rule.templates.map((item) => `${item.courtName} ${item.time}`).join(', ')}
              </p>
              <p>
                {rule.isActive ? 'Aktif' : rule.stoppedAt ? 'Dihentikan admin' : 'Selesai'} ·{' '}
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
        </>
      )}
    </div>
  );
}
