'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
dayjs.locale('id')

interface OpenScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  selectedCourts: { id: number; name: string; date: string }[]
  schedules: { time: string; available: boolean }[]
  onSelectSchedule: (court: { id: number; name: string; date: string }, time: string) => void
}

export default function OpenScheduleModal({
  open,
  onOpenChange,
  title,
  selectedCourts,
  schedules,
  onSelectSchedule,
}: OpenScheduleModalProps) {
  const handleSelect = (court: { id: number; name: string; date: string }, time: string) => {
    onSelectSchedule(court, time)
    onOpenChange(false) // tutup modal setelah memilih
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-11/12 max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
          {selectedCourts.map((court) => (
            <div key={court.id} className="border rounded-lg p-3">
              <p className="font-semibold mb-1">{court.name}</p>
              <p className="text-xs text-muted-foreground mb-3">
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
  )
}
