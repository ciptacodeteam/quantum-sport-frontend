import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { resolveMediaUrl } from '@/lib/utils';
import { CreditCard, Receipt, Wallet } from 'lucide-react';
import Image from 'next/image';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
});
const formatCurrency = (value: number) => currencyFormatter.format(value).replace(/\s/g, '');

type Method = { name?: string; logo?: string; channel?: string } | undefined;

export default function PaymentSummaryCard({
  subtotal,
  processingFee,
  total,
  method
}: {
  subtotal: number;
  processingFee: number;
  total: number;
  method?: Method;
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
          <div className="bg-primary/10 rounded-lg p-2">
            <Receipt className="text-primary h-5 w-5" />
          </div>
          <span className="text-base">Ringkasan Pembayaran</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Price Breakdown */}
        <div className="space-y-3 rounded-lg bg-gray-50 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Biaya Layanan</span>
            <span className="text-sm font-semibold text-gray-900">
              {processingFee > 0 ? formatCurrency(processingFee) : 'Gratis'}
            </span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="bg-primary/5 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="text-primary h-5 w-5" />
              <span className="text-base font-bold text-gray-900">Total Pembayaran</span>
            </div>
            <span className="text-primary text-base font-bold">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        {method && (
          <div className="rounded-lg border bg-white p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-700 sm:text-base">
                Metode Pembayaran
              </h4>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="mt-2 flex items-center gap-3">
                {method.logo && (
                  <div className="flex h-10 w-16 items-center justify-center p-2">
                    <Image
                      src={resolveMediaUrl(method.logo) || ''}
                      unoptimized
                      alt={method.name || 'Payment Method'}
                      width={64}
                      height={32}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{method.name || 'Transfer Bank'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
