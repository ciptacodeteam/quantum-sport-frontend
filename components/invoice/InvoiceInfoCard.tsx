import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dayjs from 'dayjs';
import { CopyButton } from '../ui/clipboard-copy';
import { getStatusColor, getStatusLabel } from './status';

type Props = {
  invoiceNumber?: string;
  issuedAt: string | Date;
  dueDate?: string | Date | null;
  paidAt?: string | Date | null;
  bookingStatus?: string;
};

export default function InvoiceInfoCard({
  invoiceNumber,
  issuedAt,
  dueDate,
  paidAt,
  bookingStatus
}: Props) {
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Informasi Invoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-600">Sales ID</p>
            <div className="flex items-center">
              <p className="font-semibold">{invoiceNumber}</p>
              <CopyButton variant={'ghost'} content={invoiceNumber || ''} className="ml-2" />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Tanggal Pembuatan</p>
            <p className="font-semibold">{dayjs(issuedAt).format('DD MMMM YYYY, HH:mm')}</p>
          </div>
          {dueDate && (
            <div>
              <p className="text-sm text-gray-600">Jatuh Tempo</p>
              <p className="font-semibold">{dayjs(dueDate).format('DD MMMM YYYY, HH:mm')}</p>
            </div>
          )}
          {paidAt && (
            <div>
              <p className="text-sm text-gray-600">Tanggal Pembayaran</p>
              <p className="font-semibold text-green-600">
                {dayjs(paidAt).format('DD MMMM YYYY, HH:mm')}
              </p>
            </div>
          )}
          {bookingStatus && (
            <div>
              <p className="text-sm text-gray-600">Status Booking</p>
              <Badge className={getStatusColor(bookingStatus)} variant="outline">
                {getStatusLabel(bookingStatus)}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
