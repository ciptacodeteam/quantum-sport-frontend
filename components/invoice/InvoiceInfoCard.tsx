import dayjs from '@/lib/dayjs';
import { CopyButton } from '../ui/clipboard-copy';
import { getStatusColor, getStatusLabel } from './status';
type Props = {
  invoiceNumber?: string;
  issuedAt: string | Date;
  dueDate?: string | Date | null;
  paidAt?: string | Date | null;
  invoiceStatus?: string;
};
export default function InvoiceInfoCard({
  invoiceNumber,
  issuedAt,
  dueDate,
  paidAt,
  invoiceStatus
}: Props) {
  const date = (value: string | Date) =>
    dayjs(value).tz('Asia/Jakarta').format('D MMM YYYY, HH:mm [WIB]');
  return (
    <section className="border border-black/15 bg-white p-5 sm:p-6">
      <h2 className="mb-5 text-lg font-medium">Informasi transaksi</h2>
      <dl className="grid gap-5 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="mb-1 text-black/45">Nomor invoice</dt>
          <dd className="flex items-center gap-2">
            <span className="font-medium break-all">{invoiceNumber}</span>
            <CopyButton variant="ghost" content={invoiceNumber || ''} className="size-9 shrink-0" />
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-black/45">Dibuat pada</dt>
          <dd>{date(issuedAt)}</dd>
        </div>
        {dueDate && (
          <div>
            <dt className="mb-1 text-black/45">Batas pembayaran</dt>
            <dd>{date(dueDate)}</dd>
          </div>
        )}
        {paidAt && (
          <div>
            <dt className="mb-1 text-black/45">Dibayar pada</dt>
            <dd>{date(paidAt)}</dd>
          </div>
        )}
        {invoiceStatus && (
          <div>
            <dt className="mb-2 text-black/45">Status</dt>
            <dd>
              <span
                className={`inline-flex border px-2.5 py-1 text-xs ${getStatusColor(invoiceStatus)}`}
              >
                {getStatusLabel(invoiceStatus)}
              </span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
