'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { adminCoachMyScheduleQueryOptions } from '@/queries/admin/coach';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconCalendar } from '@tabler/icons-react';

const CoachSelfView = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);

  // Window controls (default next 30 days)
  const [startAt, setStartAt] = useState<string>(dayjs().startOf('day').toISOString());
  const [endAt, setEndAt] = useState<string>(dayjs().add(30, 'day').endOf('day').toISOString());

  const { data: mySchedule } = useQuery(adminCoachMyScheduleQueryOptions(startAt, endAt));

  const slotsByDate = useMemo(() => {
    const slots = mySchedule || [];
    const map = new Map<string, { label: string; items: any[] }>();
    slots.forEach((s: any) => {
      const key = s.date || dayjs(s.startAt).format('YYYY-MM-DD');
      if (!map.has(key)) {
        map.set(key, {
          label: dayjs(s.startAt || `${s.date} ${s.startTime}`).format('dddd, DD MMM YYYY'),
          items: []
        });
      }
      map.get(key)!.items.push(s);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({ date, ...v }));
  }, [mySchedule]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nama</span>
            <span className="font-medium">{me?.name || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{me?.email || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telepon</span>
            <span className="font-medium">{me?.phone || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{me?.role || '-'}</span>
          </div>

          <Separator className="my-2" />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Rentang Waktu</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                type="datetime-local"
                value={dayjs(startAt).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => setStartAt(dayjs(e.target.value).toISOString())}
              />
              <Input
                type="datetime-local"
                value={dayjs(endAt).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => setEndAt(dayjs(e.target.value).toISOString())}
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                className="gap-1"
                onClick={() => {
                  // trigger refetch by updating state (react-query uses key changes)
                  setStartAt((s) => dayjs(s).toISOString());
                }}
              >
                <IconCalendar className="h-4 w-4" />
                Terapkan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Jadwal Saya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {slotsByDate.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada jadwal tersedia.</p>
          ) : (
            slotsByDate.map(({ date, label, items }) => (
              <div key={date} className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {items
                    .sort(
                      (a: any, b: any) =>
                        new Date(a.startAt || `${a.date} ${a.startTime}`).getTime() -
                        new Date(b.startAt || `${b.date} ${b.startTime}`).getTime()
                    )
                    .map((s: any) => {
                      const start = s.startTime || dayjs(s.startAt).format('HH:mm');
                      const end = s.endTime || dayjs(s.endAt).format('HH:mm');
                      const isBooked = Boolean(s.isBooked);
                      const userName = s.booking?.user?.name;
                      return (
                        <div key={s.id || s.slotId} className="rounded-md border p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {start} - {end}
                            </span>
                            <span
                              className={
                                'rounded px-2 py-0.5 text-[10px] ' +
                                (isBooked
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : s.isAvailable
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-gray-50 text-gray-700 border border-gray-200')
                              }
                            >
                              {isBooked ? 'Booked' : s.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          {isBooked && userName && (
                            <div className="mt-1 text-[11px] text-muted-foreground truncate">
                              {userName}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                <Separator />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachSelfView;

