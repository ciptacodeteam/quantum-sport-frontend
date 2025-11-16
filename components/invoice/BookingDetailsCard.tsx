import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import { Calendar, Clock, MapPin } from 'lucide-react';

type Detail = any;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  })
    .format(value)
    .replace(/\s/g, '');

export default function BookingDetailsCard({ details }: { details: Detail[] }) {
  const grouped = (details || []).reduce(
    (acc: any, detail: any) => {
      const date = dayjs(detail.slot?.startAt).format('YYYY-MM-DD');
      const courtName = detail.court?.name || detail.slot?.court?.name || 'Unknown Court';

      if (!acc[date]) acc[date] = {};
      if (!acc[date][courtName]) acc[date][courtName] = [];
      acc[date][courtName].push(detail);
      return acc;
    },
    {} as Record<string, Record<string, Detail[]>>
  );

  // Calculate total price
  const totalPrice = (details || []).reduce((sum, detail) => sum + (detail.price || 0), 0);
  const totalSlots = (details || []).length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-4 text-lg sm:text-xl">
            <div className="rounded-lg bg-gray-100 p-2">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <span>Detail Pemesanan Lapangan</span>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{totalSlots} Slot</Badge>
            <Badge variant="outline">{formatCurrency(totalPrice)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        {Object.entries(grouped).map(([date, courts]) => (
          <div key={date} className="space-y-3 sm:space-y-4">
            {/* Date Header */}
            <div className="bg-muted/30 flex items-center gap-2.5 rounded-lg border p-3 sm:gap-3 sm:p-4">
              <div className="bg-muted/50 rounded-lg p-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold sm:text-base">
                  {dayjs(date).format('dddd, DD MMMM YYYY')}
                </p>
                <p className="text-xs text-gray-600 sm:text-sm">
                  {Object.keys(courts as Record<string, any>).length} Lapangan
                </p>
              </div>
            </div>

            {/* Courts */}
            <div className="space-y-3">
              {Object.entries(courts as Record<string, Detail[]>).map(([courtName, items]) => (
                <div
                  key={courtName}
                  className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4"
                >
                  {/* Court Name */}
                  <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-600 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-gray-900">{courtName}</span>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-2">
                    {items.map((detail: any, idx: number) => (
                      <div
                        key={detail.id || idx}
                        className="flex flex-col gap-2 rounded-md bg-gray-50 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:p-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="rounded-md bg-white p-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-600 sm:h-4 sm:w-4" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900 sm:text-base">
                              {dayjs(detail.slot?.startAt).format('HH:mm')} -{' '}
                              {dayjs(detail.slot?.endAt).format('HH:mm')}
                            </span>
                            <p className="text-xs text-gray-500 sm:hidden">
                              {formatCurrency(detail.price)}
                            </p>
                          </div>
                        </div>
                        <span className="hidden text-base font-bold sm:block">
                          {formatCurrency(detail.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Court Subtotal */}
                  {items.length > 1 && (
                    <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 text-sm sm:text-base">
                      <span className="text-gray-600">Subtotal ({items.length} slot)</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(
                          items.reduce((sum: number, d: any) => sum + (d.price || 0), 0)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
