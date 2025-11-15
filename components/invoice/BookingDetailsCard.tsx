import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dayjs from 'dayjs';
import { Calendar, Clock, MapPin } from 'lucide-react';

type Detail = any;

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

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Detail Pemesanan Lapangan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([date, courts]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Calendar className="text-primary h-5 w-5" />
              {dayjs(date).format('dddd, DD MMMM YYYY')}
            </div>
            {Object.entries(courts).map(([courtName, items]) => (
              <div key={courtName} className="ml-4 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  {courtName}
                </div>
                <div className="ml-6 space-y-2">
                  {items.map((detail: any, idx: number) => (
                    <div
                      key={detail.id || idx}
                      className="flex items-center justify-between border-b py-2 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>
                          {dayjs(detail.slot?.startAt).format('HH:mm')} -{' '}
                          {dayjs(detail.slot?.endAt).format('HH:mm')}
                        </span>
                      </div>
                      <span className="font-semibold">
                        Rp{Number(detail.price).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
