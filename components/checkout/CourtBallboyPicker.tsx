'use client';

import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getBallboyAvailabilityApi } from '@/api/ballboy';
import { Button } from '@/components/ui/button';
import { useBookingClock } from '@/hooks/useBookingClock';
import { ballboyCartItem, ballboyMatchesCourt, courtBallboyRange } from '@/lib/ballboy-booking';
import { parseScheduleDatetime } from '@/lib/admin-schedule-time';
import type { BookingItem, SelectedBallboy } from '@/stores/useBookingStore';
import type { BallboyAvailability } from '@/types/model';
import { cn } from '@/lib/utils';

export default function CourtBallboyPicker({
  sessions,
  branchId,
  selected,
  onSave,
  onCancel
}: {
  sessions: BookingItem[];
  branchId: string;
  selected: SelectedBallboy[];
  onSave: (items: SelectedBallboy[]) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(selected);
  const now = useBookingClock();
  const queries = useQueries({
    queries: sessions.map((session) => {
      const range = courtBallboyRange(session);
      return {
        queryKey: ['ballboy', 'availability', branchId, session.slotId, range.startAt, range.endAt],
        queryFn: async () => {
          const response = await getBallboyAvailabilityApi({ ...range, courtSport: 'TENNIS' });
          return (response.data as BallboyAvailability[]).filter(
            (option) =>
              ballboyMatchesCourt(
                { ...ballboyCartItem(option), courtSlotId: session.slotId },
                session
              ) && parseScheduleDatetime(option.startAt).valueOf() > Date.now()
          );
        },
        refetchInterval: 10000,
        refetchOnWindowFocus: true
      };
    })
  });
  const invalid = draft.some((item) => {
    const index = sessions.findIndex((court) => ballboyMatchesCourt(item, court));
    return (
      index < 0 ||
      !item.startAt ||
      parseScheduleDatetime(item.startAt).valueOf() <= now ||
      !queries[index].data?.some(
        (option) => option.slotId === item.slotId && option.price === item.price
      )
    );
  });
  const total = draft.reduce((sum, item) => sum + item.price, 0);
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-black/55">
        Tambahkan ballboy sesuai lapangan dan jam bermain Anda. Biaya digabung dalam pembayaran ini.
        Maksimal satu ballboy per lapangan per jam.
      </p>
      <div className="max-h-[50dvh] space-y-5 overflow-y-auto pr-1">
        {sessions.map((court, index) => {
          const query = queries[index];
          const chosen = draft.find((item) => item.courtSlotId === court.slotId);
          const range = courtBallboyRange(court);
          return (
            <section
              key={court.slotId}
              aria-label={`Ballboy ${court.courtName} ${range.startAt}`}
              className="space-y-3 border border-black/15 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">{court.courtName}</h3>
                  <p className="mt-1 text-xs text-black/50">
                    {court.date} · {range.startAt.slice(11, 16)}–{range.endAt.slice(11, 16)} WIB
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-[#ad422b] underline underline-offset-4"
                  onClick={() =>
                    setDraft(draft.filter((item) => item.courtSlotId !== court.slotId))
                  }
                >
                  Tanpa ballboy
                </button>
              </div>
              {query.isPending ? (
                <p role="status" className="text-xs text-black/50">
                  Memuat ballboy...
                </p>
              ) : query.isError ? (
                <p role="alert" className="text-xs text-red-700">
                  Ketersediaan belum dapat dimuat.{' '}
                  <button type="button" className="underline" onClick={() => void query.refetch()}>
                    Coba lagi
                  </button>
                </p>
              ) : !query.data?.length ? (
                <p className="text-xs text-black/50">Tidak ada ballboy tersedia untuk jam ini.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {query.data.map((option) => {
                    const occupied = draft.some(
                      (item) =>
                        item.courtSlotId !== court.slotId &&
                        (item.slotId === option.slotId ||
                          (item.ballboyId === option.ballboy.id &&
                            item.startAt &&
                            item.endAt &&
                            parseScheduleDatetime(item.startAt).valueOf() <
                              parseScheduleDatetime(option.endAt).valueOf() &&
                            parseScheduleDatetime(item.endAt).valueOf() >
                              parseScheduleDatetime(option.startAt).valueOf()))
                    );
                    const picked = chosen?.slotId === option.slotId;
                    const expired = parseScheduleDatetime(option.startAt).valueOf() <= now;
                    return (
                      <button
                        key={option.slotId}
                        type="button"
                        disabled={occupied || expired}
                        aria-pressed={picked}
                        aria-label={`Pilih ${option.ballboy.name} untuk ${court.courtName} ${range.startAt.slice(11, 16)}`}
                        className={cn(
                          'flex items-center justify-between gap-3 border p-3 text-left disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/35',
                          picked
                            ? 'border-[#ad422b] bg-[#ad422b]/5'
                            : 'border-black/15 hover:border-[#ad422b]'
                        )}
                        onClick={() => {
                          const remaining = draft.filter(
                            (item) => item.courtSlotId !== court.slotId
                          );
                          setDraft(
                            picked
                              ? remaining
                              : [
                                  ...remaining,
                                  {
                                    ...ballboyCartItem(option),
                                    courtSlotId: court.slotId,
                                    courtId: court.courtId,
                                    courtName: court.courtName
                                  }
                                ]
                          );
                        }}
                      >
                        <span>
                          <span className="block text-sm font-medium">{option.ballboy.name}</span>
                          <span className="mt-1 block text-xs">
                            Rp{option.price.toLocaleString('id-ID')}
                          </span>
                        </span>
                        <span className="text-[11px]">
                          {occupied
                            ? 'Dipilih di lapangan lain'
                            : expired
                              ? 'Tidak tersedia'
                              : picked
                                ? 'Dipilih'
                                : 'Tersedia'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {chosen && <p className="text-xs text-[#ad422b]">Terpilih: {chosen.ballboyName}</p>}
            </section>
          );
        })}
      </div>
      {draft.length > 0 && invalid && (
        <p role="alert" className="text-xs text-red-700">
          Ada pilihan yang sudah tidak tersedia atau harganya berubah. Pilih ulang atau lanjutkan
          tanpa ballboy.
        </p>
      )}
      <div className="flex justify-between border-t border-black/15 pt-4 text-sm">
        <span>Total add-ons</span>
        <span className="font-medium">Rp{total.toLocaleString('id-ID')}</span>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 rounded-full" onClick={onCancel}>
          Batal
        </Button>
        <Button
          className="flex-1 rounded-full bg-black text-white"
          disabled={
            draft.length > 0 &&
            (invalid || queries.some((query) => query.isFetching || query.isError))
          }
          onClick={() => onSave(draft)}
        >
          Simpan add-ons
        </Button>
      </div>
    </div>
  );
}
