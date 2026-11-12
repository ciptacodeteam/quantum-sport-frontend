'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useHasRole } from '@/hooks/useRoleAccess';
import { createManagementCustomerApi, updateManagementCustomerApi } from '@/api/admin/customer';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Customer } from '@/types/model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

export function ManagementCustomerForm({
  customer,
  onSaved
}: {
  customer?: Customer;
  onSaved?: () => void;
}) {
  const allowed = useHasRole(['ADMIN', 'SUPER_ADMIN']);
  const client = useQueryClient();
  const [enabled, setEnabled] = useState(customer?.isManagement ?? !customer);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [from, setFrom] = useState(customer?.managementValidFrom?.slice(0, 10) ?? '');
  const [until, setUntil] = useState(customer?.managementValidUntil?.slice(0, 10) ?? '');
  const validDates = !from || !until || from <= until;
  const save = useMutation({
    mutationFn: () =>
      customer
        ? updateManagementCustomerApi(customer.id, {
            isManagement: enabled,
            managementValidFrom: from || null,
            managementValidUntil: until || null
          })
        : createManagementCustomerApi({
            name: name.trim(),
            phone: phone.trim(),
            managementValidFrom: from || null,
            managementValidUntil: until || null
          }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'customers'] });
      toast.success(
        customer ? 'Kategori Management diperbarui.' : 'Pelanggan Management berhasil dibuat.'
      );
      onSaved?.();
    }
  });
  if (!allowed) return null;
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (allowed && validDates && !save.isPending) save.mutate();
      }}
    >
      {!customer && (
        <>
          <div className="space-y-2">
            <Label htmlFor="management-name">Nama pelanggan</Label>
            <Input
              id="management-name"
              required
              minLength={3}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={save.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="management-phone">Nomor WhatsApp</Label>
            <Input
              id="management-phone"
              type="tel"
              required
              minLength={10}
              maxLength={20}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="081234567890"
              disabled={save.isPending}
            />
          </div>
        </>
      )}
      {customer && (
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="management-enabled">Pelanggan Management</Label>
          <Switch
            id="management-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={save.isPending}
          />
        </div>
      )}
      <p className="text-muted-foreground text-xs leading-relaxed">
        Harga khusus hanya untuk coaching satuan in-house yang dipesan melalui dashboard
        admin/kasir. Tarif mengikuti cabang, olahraga, dan tanggal bermain. Booking website dan
        paket prabayar mengikuti tarif reguler masing-masing.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="management-from">Berlaku mulai (opsional)</Label>
          <Input
            id="management-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            disabled={save.isPending || !enabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="management-until">Berlaku sampai (opsional)</Label>
          <Input
            id="management-until"
            type="date"
            min={from || undefined}
            value={until}
            onChange={(event) => setUntil(event.target.value)}
            disabled={save.isPending || !enabled}
          />
        </div>
      </div>
      {!validDates && (
        <p role="alert" className="text-destructive text-xs">
          Tanggal berakhir harus sama atau setelah tanggal mulai.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="text-destructive text-sm">
          {getApiErrorMessage(save.error, 'Pengaturan Management belum dapat disimpan.')}
        </p>
      )}
      <Button
        type="submit"
        disabled={
          save.isPending ||
          !validDates ||
          (!customer && (name.trim().length < 3 || phone.trim().length < 10))
        }
      >
        {save.isPending
          ? 'Menyimpan…'
          : customer
            ? 'Simpan kategori Management'
            : 'Buat pelanggan Management'}
      </Button>
    </form>
  );
}
export default function CreateManagementCustomer() {
  const allowed = useHasRole(['ADMIN', 'SUPER_ADMIN']);
  const [open, setOpen] = useState(false);
  if (!allowed) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Buat pelanggan Management</Button>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Buat pelanggan Management</DialogTitle>
          <DialogDescription>
            Untuk pelanggan baru. Jika nomor sudah terdaftar, aktifkan Management melalui detail
            pelanggan.
          </DialogDescription>
        </DialogHeader>
        <ManagementCustomerForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
