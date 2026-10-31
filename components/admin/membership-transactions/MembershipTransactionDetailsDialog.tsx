'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/clipboard-copy';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { PAYMENT_STATUS_BADGE_VARIANT, PAYMENT_STATUS_MAP } from '@/lib/constants';
import { formatBookingDate } from '@/lib/booking-display';
import { membershipStatus } from '@/lib/membership-transaction-display';
import { formatCurrency, formatPhone } from '@/lib/utils';
import type { MembershipUser } from '@/types/model';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

function PaymentRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="min-w-0 text-sm break-all">{children}</dd>
    </div>
  );
}

export default function MembershipTransactionDetailsDialog({
  transaction
}: {
  transaction: MembershipUser;
}) {
  const { user, membership, invoice } = transaction;
  const status = membershipStatus(transaction);
  const reference = invoice?.payment?.externalRef || invoice?.payment?.referenceId;
  const dueDate = invoice?.dueDate || invoice?.expiresAt;
  return (
    <DialogContent className="flex max-h-[90dvh] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-xl">
      <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-5 pr-12 text-left">
        <DialogTitle className="text-foreground text-lg">Detail pemesanan Value Pack</DialogTitle>
        <DialogDescription>Ringkasan paket, pelanggan, dan pembayaran.</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <section
          aria-label="Ringkasan Value Pack"
          className="bg-muted/20 space-y-4 rounded-lg border p-4"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {membership?.sport && (
                <Badge variant="outline">
                  {membership.sport === 'TENNIS' ? 'Tennis' : 'Padel'}
                </Badge>
              )}
              <Badge
                variant={
                  status === 'Aktif'
                    ? 'lightSuccess'
                    : status === 'Ditangguhkan'
                      ? 'lightWarning'
                      : 'lightNeutral'
                }
              >
                {status}
              </Badge>
            </div>
            <h3 className="text-base leading-snug font-semibold break-words">
              {membership?.name || 'Value Pack'}
            </h3>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3">
            <Field label="Mulai berlaku">
              {formatBookingDate(transaction.startDate, 'DD MMM YYYY')}
            </Field>
            <Field label="Berlaku sampai">
              {transaction.endDate ? formatBookingDate(transaction.endDate, 'DD MMM YYYY') : '—'}
            </Field>
            <Field label="Sisa sesi">
              <span className="tabular-nums">{transaction.remainingSessions}</span>
              <span className="text-muted-foreground font-normal">
                {' '}
                / {membership?.sessions ?? '—'} sesi
              </span>
            </Field>
            {!!transaction.debtSettledSessions && (
              <Field label="Kuota untuk pelunasan minus">
                {transaction.debtSettledSessions} sesi
              </Field>
            )}
            <Field label="Sisa masa berlaku">
              <span className="tabular-nums">{transaction.remainingDuration} hari</span>
            </Field>
          </dl>
          {(membership?.description || !!membership?.benefits?.length) && (
            <details className="border-t pt-3">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
                Deskripsi dan manfaat paket
              </summary>
              <div className="mt-3 space-y-2 text-sm leading-relaxed">
                {membership?.description && (
                  <p className="text-muted-foreground break-words">{membership.description}</p>
                )}
                {!!membership?.benefits?.length && (
                  <ul className="text-muted-foreground list-disc space-y-1 pl-4">
                    {membership.benefits.map((benefit) => (
                      <li key={benefit.id} className="break-words">
                        {benefit.benefit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          )}
        </section>

        {transaction.isSuspended && (
          <section aria-label="Penangguhan" className="space-y-2 rounded-lg border p-3">
            <h3 className="text-sm font-semibold">Informasi penangguhan</h3>
            <p className="text-muted-foreground text-sm break-words">
              {transaction.suspensionReason || 'Tanpa keterangan'}
            </p>
            {transaction.suspensionEndDate && (
              <p className="text-muted-foreground text-xs">
                Berakhir {formatBookingDate(transaction.suspensionEndDate, 'DD MMM YYYY')}
              </p>
            )}
          </section>
        )}

        <section aria-label="Pelanggan" className="space-y-3">
          <h3 className="text-sm font-semibold">Pelanggan</h3>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nama">{user?.name || '—'}</Field>
            {user?.phone && <Field label="Telepon">{formatPhone(user.phone)}</Field>}
            {user?.email && (
              <div className="min-w-0 sm:col-span-2">
                <Field label="Email">
                  <span className="break-all">{user.email}</span>
                </Field>
              </div>
            )}
          </dl>
        </section>

        {invoice && (
          <section aria-label="Pembayaran" className="space-y-2">
            <h3 className="text-sm font-semibold">Pembayaran</h3>
            <dl className="divide-y rounded-lg border px-3">
              <PaymentRow label="Nomor invoice">
                <span className="flex items-center gap-1 font-mono text-xs">
                  {invoice.number}
                  <CopyButton
                    content={invoice.number}
                    variant="ghost"
                    size="sm"
                    aria-label="Salin nomor invoice"
                  />
                </span>
              </PaymentRow>
              <PaymentRow label="Status pembayaran">
                <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[invoice.status]}>
                  {PAYMENT_STATUS_MAP[invoice.status]}
                </Badge>
              </PaymentRow>
              {invoice.payment?.method?.name && (
                <PaymentRow label="Metode">{invoice.payment.method.name}</PaymentRow>
              )}
              {invoice.payment && (
                <PaymentRow label="Biaya pembayaran">
                  <span className="tabular-nums">
                    {formatCurrency(invoice.payment.fees ?? invoice.payment.fee ?? 0)}
                  </span>
                </PaymentRow>
              )}
              {reference && (
                <PaymentRow label="Referensi">
                  <span className="font-mono text-xs">{reference}</span>
                </PaymentRow>
              )}
              {invoice.paidAt && (
                <PaymentRow label="Dibayar pada">
                  {formatBookingDate(invoice.paidAt, 'DD MMM YYYY, HH:mm')} WIB
                </PaymentRow>
              )}
              {dueDate && ['PENDING', 'AWAITING_CONFIRMATION'].includes(invoice.status) && (
                <PaymentRow label="Batas pembayaran">
                  {formatBookingDate(dueDate, 'DD MMM YYYY, HH:mm')} WIB
                </PaymentRow>
              )}
            </dl>
          </section>
        )}
        <p className="text-muted-foreground text-xs">
          Dibuat {formatBookingDate(transaction.createdAt, 'DD MMM YYYY, HH:mm')} WIB
        </p>
      </div>
      <footer className="bg-muted/20 flex shrink-0 items-center justify-between gap-3 border-t px-5 py-4">
        <div>
          {invoice && (
            <>
              <p className="text-muted-foreground text-xs">Total pembayaran</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(invoice.total)}
              </p>
            </>
          )}
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="rounded-lg px-5 shadow-none">
            Tutup
          </Button>
        </DialogClose>
      </footer>
    </DialogContent>
  );
}
