'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { resolveMediaUrl } from '@/lib/utils';
import { CheckCircle, Copy, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import PaymentCountdown from './PaymentCountdown';

export default function PaymentActionCard({
  invoice,
  canPay,
  onChooseMethod
}: {
  invoice: any;
  canPay: boolean;
  onChooseMethod: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  if (!canPay) return null;

  const paymentMeta = invoice?.paymentMeta;
  const payment = invoice?.payment as any;
  const paymentMethod = payment?.method;
  const channelCode = paymentMethod?.channel || paymentMeta?.channel_code;

  const isQRIS = channelCode === 'QRIS';
  const qrString = paymentMeta?.actions?.find(
    (action: any) => action.descriptor === 'QR_STRING'
  )?.value;

  const isVA = channelCode?.includes('VIRTUAL_ACCOUNT') || channelCode?.includes('_VA');
  const vaAction = paymentMeta?.actions?.find(
    (action: any) => action.descriptor === 'VIRTUAL_ACCOUNT_NUMBER'
  );
  const vaNumber = vaAction?.value || paymentMeta?.channel_properties?.account_number;
  const vaDisplayName = vaAction?.display_name || paymentMethod?.name;
  const vaExpiry = vaAction?.expiry || paymentMeta?.channel_properties?.expires_at;

  const paymentExpiry = vaExpiry ? vaExpiry : invoice ? invoice.dueDate : null;

  const isEWallet = ['OVO', 'DANA', 'LINKAJA', 'SHOPEEPAY'].includes(channelCode);
  const paymentUrl =
    paymentMeta?.actions?.find(
      (action: any) => action.descriptor === 'DEEPLINK_CHECKOUT' || action.type === 'REDIRECT'
    )?.url || invoice?.paymentUrl;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Berhasil disalin!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="text-center">
          {paymentMethod && (
            <div className="mb-3 flex flex-col items-center justify-center gap-2">
              {paymentMethod.logo && (
                <Image
                  src={resolveMediaUrl(paymentMethod.logo) || ''}
                  unoptimized
                  alt={paymentMethod.name}
                  width={48}
                  height={24}
                  className="h-6 w-auto object-contain"
                />
              )}
              <span className="text-sm font-medium">{paymentMethod.name}</span>
            </div>
          )}

          <h3 className="text-sm text-gray-700">Total Pembayaran</h3>

          <h4 className="mb-6 text-2xl font-bold">
            {currencyFormatter.format(invoice.total).replace(/\s/g, '')}
          </h4>

          {isQRIS && qrString && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-4 shadow-md">
                  <div className="bg-white p-2">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`}
                      alt="QR Code"
                      width={200}
                      unoptimized
                      height={200}
                      className="h-48 w-48"
                    />
                  </div>
                </div>
              </div>

              {paymentExpiry && (
                <div className="mb-5 flex justify-center">
                  <PaymentCountdown dueDate={paymentExpiry} status={invoice.status} />
                </div>
              )}
              <p className="text-xs text-gray-600">
                Scan QR code di atas menggunakan aplikasi pembayaran QRIS Anda
              </p>
            </div>
          )}

          {isVA && vaNumber && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="mb-2 text-sm text-gray-600">Nomor Virtual Account</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-2xl font-bold tracking-wider">{vaNumber}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vaNumber, 'va')}>
                    {copiedField === 'va' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Bank: <span className="font-semibold">{vaDisplayName}</span>
                </div>
              </div>
              {paymentExpiry && (
                <div className="mb-5 flex justify-center">
                  <PaymentCountdown dueDate={paymentExpiry} status={invoice.status} />
                </div>
              )}
              <div className="space-y-2 text-left text-sm text-gray-700">
                <p className="font-semibold">Cara Pembayaran:</p>
                <ol className="ml-2 list-inside list-decimal space-y-1">
                  <li>Buka aplikasi mobile banking atau ATM</li>
                  <li>Pilih menu Transfer / Bayar</li>
                  <li>Pilih Virtual Account {vaDisplayName}</li>
                  <li>Masukkan nomor VA di atas</li>
                  <li>
                    Masukkan nominal {currencyFormatter.format(invoice.total).replace(/\s/g, '')}
                  </li>
                  <li>Konfirmasi dan selesaikan pembayaran</li>
                </ol>
              </div>
            </div>
          )}

          {(isEWallet || paymentUrl) && !isQRIS && !isVA && (
            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={() => window.open(paymentUrl, '_blank')}
              >
                <CreditCard className="mr-2 h-5 w-5" /> Bayar dengan {paymentMethod?.name}
              </Button>
              <p className="text-sm text-gray-600">
                Anda akan diarahkan ke halaman pembayaran {paymentMethod?.name}
              </p>
            </div>
          )}

          {!isQRIS && !isVA && !paymentUrl && (
            <Button size="lg" className="w-full md:w-auto" onClick={onChooseMethod}>
              <CreditCard className="mr-2 h-5 w-5" /> Pilih Metode Pembayaran
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});
