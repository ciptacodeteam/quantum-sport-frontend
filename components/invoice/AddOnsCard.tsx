import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dayjs from 'dayjs';

type Props = {
  coaches: any[];
  ballboys: any[];
  inventories: any[];
};

export default function AddOnsCard({ coaches = [], ballboys = [], inventories = [] }: Props) {
  if ((coaches.length || ballboys.length || inventories.length) === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Layanan Tambahan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {coaches.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Pelatih</h4>
            {coaches.map((coach: any, idx: number) => (
              <div
                key={coach.id || idx}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{coach.slot?.staff?.name || 'Pelatih'}</p>
                  <p className="text-sm text-gray-600">
                    {coach.bookingCoachType?.name} -{' '}
                    {dayjs(coach.slot?.startAt).format('DD MMM YYYY, HH:mm')}
                  </p>
                </div>
                <span className="font-semibold">
                  Rp{Number(coach.price).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}

        {ballboys.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Ballboy</h4>
            {ballboys.map((ballboy: any, idx: number) => (
              <div
                key={ballboy.id || idx}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{ballboy.slot?.staff?.name || 'Ballboy'}</p>
                  <p className="text-sm text-gray-600">
                    {dayjs(ballboy.slot?.startAt).format('DD MMM YYYY, HH:mm')}
                  </p>
                </div>
                <span className="font-semibold">
                  Rp{Number(ballboy.price).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}

        {inventories.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Perlengkapan</h4>
            {inventories.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{item.inventory?.name || 'Item'}</p>
                  <p className="text-sm text-gray-600">Jumlah: {item.quantity}</p>
                </div>
                <span className="font-semibold">
                  Rp{Number(item.price * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
