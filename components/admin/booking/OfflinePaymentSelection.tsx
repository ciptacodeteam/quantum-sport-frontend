'use client';
import type { PaymentMethod } from '@/types/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
export default function OfflinePaymentSelection({
  amountDue,
  methods,
  selectedId,
  onSelect,
  loading,
  error,
  onRetry,
  disabled
}: {
  amountDue: number;
  methods: PaymentMethod[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  disabled: boolean;
}) {
  return (
    <section aria-label="Pembayaran booking admin" className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Metode Pembayaran</h3>
        <Badge variant="lightWarning">Offline · Khusus Admin</Badge>
      </div>
      {amountDue <= 0 ? (
        <p className="text-muted-foreground text-xs">
          Tidak ada pembayaran tambahan untuk booking ini.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            Pilih metode pembayaran yang diterima di lokasi. Berlaku untuk booking admin dan
            walk-in.
          </p>
          {error ? (
            <div role="alert" className="space-y-2 text-xs">
              <p>Metode pembayaran belum dapat dimuat.</p>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Coba lagi
              </Button>
            </div>
          ) : (
            <>
              <Label htmlFor="booking-offline-payment">Metode pembayaran offline</Label>
              <Select
                value={selectedId}
                onValueChange={onSelect}
                disabled={disabled || loading || methods.length === 0}
              >
                <SelectTrigger id="booking-offline-payment" className="min-h-11 w-full">
                  <SelectValue
                    placeholder={loading ? 'Memuat metode...' : 'Pilih metode pembayaran'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!loading && methods.length === 0 && (
                <p role="alert" className="text-destructive text-xs">
                  Belum ada metode offline yang aktif. Tambahkan melalui Kelola Metode Pembayaran.
                </p>
              )}
            </>
          )}
          <p className="text-muted-foreground text-xs">
            Klik Konfirmasi Booking untuk langsung mencatat pembayaran dan invoice sebagai lunas.
          </p>
        </>
      )}
    </section>
  );
}
