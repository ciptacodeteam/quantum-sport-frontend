import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { resolveMediaUrl } from '@/lib/utils';

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
        <CardTitle className="flex items-center gap-2">Ringkasan Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Biaya Layanan</span>
          <span className="font-semibold">{formatCurrency(processingFee)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg">
          <span className="font-bold">Total Pembayaran</span>
          <span className="text-primary font-bold">{formatCurrency(total)}</span>
        </div>
        {method && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 font-semibold">Metode Pembayaran</h4>
            <div className="flex items-center gap-3">
              {method.logo && (
                <Image
                  src={resolveMediaUrl(method.logo) || ''}
                  unoptimized
                  alt={method.name || 'Payment Method'}
                  width={64}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
              )}
              <p className="font-medium text-gray-700">{method.name || 'Transfer Bank'}</p>
            </div>
            {method.channel && (
              <p className="mt-2 text-sm text-gray-600">Channel: {method.channel}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
