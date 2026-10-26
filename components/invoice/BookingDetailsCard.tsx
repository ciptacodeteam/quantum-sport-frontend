import { groupBookingSchedule, type BookingScheduleDetail } from '@/lib/booking-schedule';
import { CalendarDays } from 'lucide-react';

const money = (value: number) => `Rp${value.toLocaleString('id-ID')}`;
const time = (value: string) => value.slice(11).replace(':', '.');

export default function BookingDetailsCard({
  details,
  coveredByMembership = false
}: {
  details: BookingScheduleDetail[];
  coveredByMembership?: boolean;
}) {
  const schedule = groupBookingSchedule(details);

  return (
    <section aria-label="Jadwal lapangan" className="space-y-6">
      {schedule.map(({ date, courts }) => (
        <div key={date}>
          <p className="mb-4 flex items-center gap-2 text-xs text-black/50">
            <CalendarDays
              className="size-4 shrink-0 text-[#ad422b]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            {new Intl.DateTimeFormat('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }).format(new Date(`${date}T12:00:00`))}
          </p>
          <div className="divide-y divide-black/10">
            {courts.map((court) => {
              return (
                <div key={court.id} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="mb-2 text-sm font-medium">{court.name}</h3>
                  <div className="space-y-2">
                    {court.ranges.map((range, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 text-sm"
                      >
                        <p className="text-black/55 tabular-nums">
                          {time(range.start)} - {time(range.end)}
                        </p>
                        <p className="font-medium">
                          {coveredByMembership ? 'Value Pack' : money(range.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
