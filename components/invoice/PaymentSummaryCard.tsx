import { resolveMediaUrl } from '@/lib/utils';
import Image from 'next/image';
const currency = (value: number) => `Rp${Number(value).toLocaleString('id-ID')}`;
type Props = {
  subtotal: number;
  processingFee: number;
  promoDiscountAmount?: number;
  total: number;
  method?: { name?: string; logo?: string; channel?: string };
};
export default function PaymentSummaryCard({
  subtotal,
  processingFee,
  promoDiscountAmount,
  total,
  method
}: Props) {
  const logo = resolveMediaUrl(method?.logo);
  return (
    <section className="border border-black/15 bg-[#f8f8f6] p-5 sm:p-6">
      <h2 className="mb-6 text-lg font-medium">Ringkasan pembayaran</h2>
      <dl className="space-y-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-black/50">Subtotal</dt>
          <dd>{currency(subtotal)}</dd>
        </div>
        {!!promoDiscountAmount && promoDiscountAmount > 0 && (
          <div className="flex justify-between gap-4 text-[#ad422b]">
            <dt>Diskon promo</dt>
            <dd>−{currency(promoDiscountAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-black/50">Biaya layanan</dt>
          <dd>{processingFee > 0 ? currency(processingFee) : 'Gratis'}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/15 pt-5">
          <dt>Total pembayaran</dt>
          <dd className="text-xl font-medium tracking-tight text-[#ad422b]">{currency(total)}</dd>
        </div>
      </dl>
      {method && (
        <div className="mt-6 flex items-center gap-3 border-t border-black/15 pt-5">
          {logo && (
            <Image
              src={logo}
              unoptimized
              alt=""
              width={52}
              height={28}
              className="h-7 w-13 object-contain"
            />
          )}
          <div>
            <p className="text-xs text-black/45">Metode pembayaran</p>
            <p className="mt-1 text-sm">{method.name || method.channel}</p>
          </div>
        </div>
      )}
    </section>
  );
}
