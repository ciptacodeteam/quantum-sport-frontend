'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
dayjs.locale('id');

interface OpenScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  selectedCourts: { id: number; name: string; date: string }[];
  schedules: { time: string; available: boolean }[];
  onSelectSchedule: (court: { id: number; name: string; date: string }, time: string) => void;
}

export default function OpenScheduleModal({
  open,
  onOpenChange,
  title,
  selectedCourts,
  schedules,
  onSelectSchedule
}: OpenScheduleModalProps) {
  const handleSelect = (court: { id: number; name: string; date: string }, time: string) => {
    onSelectSchedule(court, time);
    onOpenChange(false); // tutup modal setelah memilih
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-11/12 max-w-lg flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {selectedCourts.map((court) => (
            <div key={court.id} className="rounded-lg border p-3">
              <p className="mb-1 font-semibold">{court.name}</p>
              <p className="text-muted-foreground mb-3 text-xs">
                {dayjs(court.date).format('dddd, D MMMM YYYY')}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {schedules.map((slot, i) => (
                  <Button
                    key={i}
                    variant={slot.available ? 'outline' : 'secondary'}
                    disabled={!slot.available}
                    onClick={() => handleSelect(court, slot.time)}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
