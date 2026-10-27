'use client';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Branch } from '@/types/branch';

export type BranchFormPayload = {
  name: string;
  address: string;
  mapsUrl: string | null;
  isActive: boolean;
};
export default function BranchFormDialog({
  open,
  branch,
  busy,
  error,
  onClose,
  onSave
}: {
  open: boolean;
  branch: Branch | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (payload: BranchFormPayload) => Promise<void>;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    void onSave({
      name: String(values.get('name')).trim(),
      address: String(values.get('address')).trim(),
      mapsUrl: String(values.get('mapsUrl') || '').trim() || null,
      isActive: values.get('isActive') === 'on'
    });
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 gap-1.5 border-b p-5 pr-12 text-left">
          <DialogTitle className="text-foreground text-lg">
            {branch ? 'Edit cabang' : 'Tambah cabang'}
          </DialogTitle>
          <DialogDescription>Lengkapi lokasi dan status operasional cabang.</DialogDescription>
        </DialogHeader>
        <form key={branch?.id || 'new'} onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {error && (
              <p
                role="alert"
                className="bg-destructive/5 text-destructive border-destructive/20 rounded-lg border p-3 text-sm"
              >
                {error}
              </p>
            )}
            <fieldset disabled={busy} className="space-y-5">
              <Field>
                <FieldLabel htmlFor="branch-name">Nama cabang</FieldLabel>
                <Input
                  id="branch-name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  defaultValue={branch?.name}
                  placeholder="Contoh: Black Padel Cemara"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="branch-address">Alamat lengkap</FieldLabel>
                <Textarea
                  id="branch-address"
                  name="address"
                  required
                  minLength={5}
                  maxLength={1000}
                  defaultValue={branch?.address}
                  placeholder="Nama jalan, nomor, dan kota"
                  className="min-h-24 resize-y"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="branch-maps">
                  Tautan Google Maps{' '}
                  <span className="text-muted-foreground font-normal">(opsional)</span>
                </FieldLabel>
                <Input
                  id="branch-maps"
                  name="mapsUrl"
                  type="url"
                  pattern="https?://.+"
                  defaultValue={branch?.mapsUrl || ''}
                  placeholder="https://maps.google.com/..."
                />
                <FieldDescription>
                  Tautan membantu pelanggan menemukan lokasi cabang.
                </FieldDescription>
              </Field>
              <div className="bg-muted/20 flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="space-y-1">
                  <label htmlFor="branch-active" className="text-sm font-medium">
                    Cabang aktif
                  </label>
                  <p className="text-muted-foreground text-sm">
                    Cabang dapat menerima aktivitas operasional.
                  </p>
                </div>
                <Checkbox
                  id="branch-active"
                  name="isActive"
                  defaultChecked={branch?.isActive ?? true}
                />
              </div>
            </fieldset>
          </div>
          <footer className="bg-muted/20 flex shrink-0 justify-end gap-2 border-t px-5 py-4">
            <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" loading={busy} aria-label="Simpan cabang">
              Simpan cabang
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
