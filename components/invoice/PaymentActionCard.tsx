'use client';

import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/utils';
import { getInvoicePayment, type PaymentInvoice } from '@/lib/invoice-payment';
import { ArrowUpRight, Check, Copy, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { toast } from 'sonner';
import PaymentCountdown from './PaymentCountdown';

const money = (value: number) => `Rp${value.toLocaleString('id-ID')}`;

export default function PaymentActionCard({
  invoice,
  canPay,
  onExpired,
  onRefresh,
  isRefreshing = false
}: {
  invoice: PaymentInvoice;
  canPay: boolean;
  onExpired?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!canPay) return null;
  const info = getInvoicePayment(invoice);
  const method = invoice.payment?.method;
  const logo = resolveMediaUrl(method?.logo);
  const copyNumber = async () => {
    if (!info.vaNumber) return;
    try {
      await navigator.clipboard.writeText(info.vaNumber);
      setCopied(true);
      toast.success('Nomor Virtual Account disalin');
    } catch {
      toast.error('Nomor belum dapat disalin. Silakan salin secara manual.');
    }
  };
  return (
    <section
      aria-label="Instruksi pembayaran"
      className="border border-black/15 bg-[#f8f8f6] p-5 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3 border-b border-black/15 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          {logo && (
            <Image
              src={logo}
              alt={method?.name ?? 'Metode pembayaran'}
              width={56}
              height={28}
              unoptimized
              className="h-7 w-14 object-contain"
            />
          )}
          <h2 className="text-sm font-medium">
            {method?.name || (info.isQRIS ? 'QRIS' : info.isVA ? 'Virtual Account' : 'Pembayaran')}
          </h2>
        </div>
        <span className="shrink-0 border border-[#ad422b]/25 px-2 py-1 text-[10px] text-[#ad422b]">
          Menunggu pembayaran
        </span>
      </div>
      <div className="my-6 text-center">
        <p className="text-xs text-black/50">Total pembayaran</p>
        <p className="mt-2 text-3xl font-medium tracking-tight tabular-nums sm:text-4xl">
          {money(invoice.total)}
        </p>
      </div>
      {info.isQRIS &&
        (info.qrString ? (
          <>
            <div className="mx-auto w-full max-w-[264px] border border-black/15 bg-white p-3 sm:p-4">
              {info.qrIsImage ? (
                // Midtrans returns a QR image URL, not an EMV payload.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={info.qrString}
                  alt="Kode QRIS pembayaran"
                  className="h-auto w-full"
                />
              ) : (
                <QRCodeSVG
                  value={info.qrString}
                  size={232}
                  marginSize={4}
                  level="M"
                  title="Kode QRIS pembayaran"
                  className="h-auto w-full"
                />
              )}
            </div>
            <p className="mx-auto mt-4 max-w-xs text-center text-xs leading-relaxed text-black/50">
              Pindai QR menggunakan aplikasi bank atau dompet digital yang mendukung QRIS.
            </p>
          </>
        ) : (
          <p
            role="status"
            className="border border-dashed border-black/20 p-5 text-center text-sm text-black/50"
          >
            Kode QR belum tersedia. Silakan cek status pembayaran kembali.
          </p>
        ))}
      {info.isVA &&
        (info.vaNumber ? (
          <div className="border border-black/15 bg-white p-4 sm:p-5">
            {info.billerCode && (
              <>
                <p className="text-[10px] tracking-wider text-black/45 uppercase">Kode perusahaan</p>
                <p className="mt-2 text-xl font-medium tabular-nums">{info.billerCode}</p>
              </>
            )}
            <p className={`text-[10px] tracking-wider text-black/45 uppercase ${info.billerCode ? 'mt-4' : ''}`}>
              {info.billerCode ? 'Kode bayar' : 'Nomor Virtual Account'}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 [container-type:inline-size]">
                <p
                  className="font-medium whitespace-nowrap tabular-nums select-all"
                  style={{ fontSize: `min(1.5rem, ${100 / (info.vaNumber.length * 0.65)}cqw)` }}
                >
                  {info.vaNumber}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 rounded-none text-[#ad422b] hover:bg-black/5"
                aria-label="Salin nomor Virtual Account"
                onClick={() => void copyNumber()}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            {info.displayName && (
              <p className="mt-2 text-xs text-black/50">Atas nama {info.displayName}</p>
            )}
          </div>
        ) : (
          <p
            role="status"
            className="border border-dashed border-black/20 p-5 text-center text-sm text-black/50"
          >
            Nomor Virtual Account belum tersedia. Silakan cek status pembayaran kembali.
          </p>
        ))}
      {info.expiresAt && (
        <div className="mt-5 flex justify-center">
          <PaymentCountdown
            dueDate={info.expiresAt}
            status={invoice.status}
            invoiceId={invoice.id}
            onExpired={onExpired}
          />
        </div>
      )}
      {info.isVA && info.vaNumber && (
        <div className="mt-6 border-t border-black/15 pt-5">
          <h3 className="text-sm font-medium">Cara pembayaran</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-black/55 marker:text-[#ad422b]">
            <li>Buka aplikasi bank atau ATM, lalu pilih pembayaran Virtual Account.</li>
            <li>Masukkan nomor Virtual Account di atas.</li>
            <li>
              Periksa penerima dan nominal {money(invoice.total)}, lalu selesaikan pembayaran.
            </li>
            <li>Kembali ke halaman ini untuk melihat status pembayaran.</li>
          </ol>
        </div>
      )}
      {!info.isQRIS &&
        !info.isVA &&
        (info.paymentUrl ? (
          <Button
            asChild
            className="mt-5 h-12 w-full gap-3 rounded-full bg-[#111111] px-6 text-xs text-white hover:bg-black/80 has-[>svg]:px-6"
          >
            <a href={info.paymentUrl} target="_blank" rel="noopener noreferrer">
              Lanjutkan pembayaran <ArrowUpRight className="size-4" strokeWidth={1.5} />
            </a>
          </Button>
        ) : (
          <p
            role="status"
            className="mt-5 border border-dashed border-black/20 p-5 text-center text-sm text-black/50"
          >
            Instruksi pembayaran belum tersedia. Silakan cek status pembayaran kembali.
          </p>
        ))}
      {onRefresh && (
        <div className="mt-6 border-t border-black/15 pt-5 text-center">
          <Button
            variant="outline"
            className="h-11 w-full gap-2 rounded-full border-black/20 bg-transparent px-5 text-xs shadow-none hover:bg-black/5 has-[>svg]:px-5"
            disabled={isRefreshing}
            onClick={onRefresh}
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            {isRefreshing ? 'Memeriksa pembayaran...' : 'Cek status pembayaran'}
          </Button>
          <p className="mt-3 text-[11px] leading-relaxed text-black/45">
            Status diperbarui otomatis setelah pembayaran dikonfirmasi.
          </p>
        </div>
      )}
    </section>
  );
}
