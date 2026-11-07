'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Clock3, UserRound, X } from 'lucide-react';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCourtBookingWindowApi } from '@/api/court';
import { getBallboyAvailabilityApi } from '@/api/ballboy';
import { useBranchStore } from '@/stores/useBranchStore';
import { useBallboyCartStore } from '@/stores/useBallboyCartStore';
import type { SelectedBallboy } from '@/stores/useBookingStore';
import type { BallboyAvailability } from '@/types/model';
import { availableBallboyHours, ballboyCartItem } from '@/lib/ballboy-booking';
import { parseScheduleDatetime } from '@/lib/admin-schedule-time';
import { useBookingClock } from '@/hooks/useBookingClock';
import dayjs, { nowJakarta } from '@/lib/dayjs';
import { cn } from '@/lib/utils';

const currency = (amount: number) => `Rp${amount.toLocaleString('id-ID')}`;
const hours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);

export default function AddOnsPage() {
  const router = useRouter();
  const branch = useBranchStore((state) => state.branch);
  const openSelector = useBranchStore((state) => state.openSelector);
  const cart = useBallboyCartStore();
  const now = useBookingClock();
  const today = dayjs(now).tz('Asia/Jakarta').format('YYYY-MM-DD');
  const [date, setDate] = useState(() => nowJakarta().format('YYYY-MM-DD'));
  const [hour, setHour] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ branchId: string | null; items: SelectedBallboy[] }>(() => ({
    branchId: cart.branchId,
    items: cart.items
  }));
  const selected = draft.branchId === branch?.id ? draft.items : [];
  const windowQuery = useQuery({
    queryKey: ['courts', 'booking-window', branch?.id, 'TENNIS'],
    queryFn: () => getCourtBookingWindowApi('TENNIS'),
    enabled: !!branch,
    refetchInterval: 60000
  });
  const withinWindow = !!windowQuery.data && date >= today && date <= windowQuery.data.endDate;
  const availability = useQuery({
    queryKey: ['ballboy', 'availability', branch?.id, date, 'TENNIS'],
    queryFn: async () => {
      const response = await getBallboyAvailabilityApi({
        startAt: `${date}T00:00:00`,
        endAt: `${dayjs(date).add(1, 'day').format('YYYY-MM-DD')}T00:00:00`,
        courtSport: 'TENNIS'
      });
      return response.data as BallboyAvailability[];
    },
    enabled: !!branch && withinWindow,
    refetchInterval: 10000,
    refetchOnWindowFocus: true
  });
  const options = useMemo(
    () => availableBallboyHours(availability.data ?? [], date, now),
    [availability.data, date, now]
  );
  const dayItems = selected.filter((item) => item.date === date);
  const invalid =
    selected.some(
      (item) => !item.startAt || parseScheduleDatetime(item.startAt).valueOf() <= now
    ) || dayItems.some((item) => !options.some((option) => option.slotId === item.slotId));
  const total = selected.reduce((sum, item) => sum + item.price, 0);

  // Hydration may finish after the initial render; restore only a matching branch cart.
  useEffect(() => {
    const stored = useBallboyCartStore.getState();
    setDraft({ branchId: stored.branchId, items: stored.items });
  }, [branch?.id]);

  const remove = (slotId?: string) =>
    setDraft({
      branchId: branch?.id ?? null,
      items: selected.filter((item) => item.slotId !== slotId)
    });
  const toggle = (option: BallboyAvailability) => {
    const exists = selected.some((item) => item.slotId === option.slotId);
    const item = ballboyCartItem(option);
    const remaining = selected.filter(
      (entry) => entry.date !== item.date || entry.timeSlot !== item.timeSlot
    );
    setDraft({ branchId: branch!.id, items: exists ? remaining : [...remaining, item] });
  };
  return (
    <div className="min-h-dvh bg-[#f8f8f6] text-[#171717]">
      <MainHeader showBack backHref="/" />
      <main className="booking-page mx-auto w-full max-w-7xl px-5 pt-28 pb-12 sm:px-8 lg:pt-44 xl:pt-32">
        <div className="mb-8 max-w-xl">
          <p className="mb-2 text-xs font-medium tracking-widest text-[#ad422b] uppercase">
            Add-ons · Tennis
          </p>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Pesan Ballboy</h1>
          <p className="mt-3 text-sm leading-relaxed text-black/55">
            Pesan ballboy resmi sesuai jam bermain Anda, tanpa membeli lapangan lagi. Pilih satu
            atau beberapa jam. Semua waktu dalam WIB.
          </p>
        </div>
        {!branch ? (
          <Button onClick={() => openSelector('/add-ons')}>Pilih cabang</Button>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section
              className="min-w-0 space-y-6 border border-black/15 bg-white p-5 sm:p-6"
              aria-label="Jadwal ballboy"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <label htmlFor="ballboy-date" className="mb-2 block text-sm font-medium">
                    Tanggal bermain
                  </label>
                  <Input
                    id="ballboy-date"
                    type="date"
                    value={date}
                    min={today}
                    max={windowQuery.data?.endDate ?? today}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setHour(null);
                    }}
                    className="w-auto rounded-none"
                  />
                </div>
                <span className="text-xs text-black/50">{branch.name}</span>
              </div>
              {windowQuery.isError || availability.isError ? (
                <div role="alert" className="space-y-3 text-sm text-red-700">
                  <p>Jadwal ballboy belum dapat dimuat.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void windowQuery.refetch();
                      void availability.refetch();
                    }}
                  >
                    Coba lagi
                  </Button>
                </div>
              ) : windowQuery.isPending || (withinWindow && availability.isPending) ? (
                <p role="status" className="text-sm text-black/50">
                  Memuat jadwal ballboy...
                </p>
              ) : !withinWindow ? (
                <p role="status" className="text-sm text-black/50">
                  Pilih tanggal dalam periode pemesanan yang tersedia.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-medium">Pilih jam</h2>
                    <span className="text-xs text-black/45">Jam abu-abu tidak tersedia</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {hours.map((time) => {
                      const choices = options.filter(
                        (option) => parseScheduleDatetime(option.startAt).format('HH:mm') === time
                      );
                      const chosen = dayItems.some((item) => item.timeSlot.startsWith(time));
                      const unavailable = choices.length === 0;
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={unavailable}
                          aria-pressed={hour === time}
                          aria-label={`Jam ${time}${unavailable ? ' tidak tersedia' : ''}`}
                          onClick={() => setHour(time)}
                          className={cn(
                            'min-h-20 border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:border-black/5 disabled:bg-black/5 disabled:text-black/25',
                            hour === time
                              ? 'border-[#ad422b] bg-[#ad422b]/5'
                              : 'border-black/15 hover:border-[#ad422b]',
                            chosen && 'ring-1 ring-[#ad422b]'
                          )}
                        >
                          <span className="block font-medium">
                            {time}–{dayjs(`${date}T${time}`).add(1, 'hour').format('HH:mm')}
                          </span>
                          <span className="mt-1 block text-[11px]">
                            {unavailable
                              ? 'Tidak tersedia'
                              : chosen
                                ? 'Dipilih'
                                : `Mulai ${currency(Math.min(...choices.map((option) => option.price)))}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!options.length && (
                    <p className="text-sm text-black/50">
                      Tidak ada ballboy tersedia pada tanggal ini.
                    </p>
                  )}
                  {hour && (
                    <section
                      aria-label={`Ballboy jam ${hour}`}
                      className="space-y-3 border-t border-black/10 pt-5"
                    >
                      <h2 className="flex items-center gap-2 text-sm font-medium">
                        <Clock3 className="size-4" />
                        Pilih ballboy · {hour}
                      </h2>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {options
                          .filter(
                            (option) =>
                              parseScheduleDatetime(option.startAt).format('HH:mm') === hour
                          )
                          .map((option) => {
                            const chosen = selected.some((item) => item.slotId === option.slotId);
                            return (
                              <button
                                key={option.slotId}
                                type="button"
                                aria-pressed={chosen}
                                onClick={() => toggle(option)}
                                className={cn(
                                  'flex items-center gap-3 border p-4 text-left',
                                  chosen
                                    ? 'border-[#ad422b] bg-[#ad422b]/5'
                                    : 'border-black/15 hover:border-[#ad422b]'
                                )}
                              >
                                <UserRound
                                  className="size-6 shrink-0 text-[#ad422b]"
                                  strokeWidth={1.5}
                                />
                                <span className="flex-1">
                                  <span className="block text-sm font-medium">
                                    {option.ballboy.name}
                                  </span>
                                  <span className="mt-1 block text-xs text-black/50">
                                    {currency(option.price)}/jam
                                  </span>
                                </span>
                                <span className="text-xs text-[#ad422b]">
                                  {chosen ? 'Dipilih' : 'Pilih'}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                      {!options.some(
                        (option) => parseScheduleDatetime(option.startAt).format('HH:mm') === hour
                      ) && (
                        <p role="status" className="text-sm text-black/50">
                          Jam ini sudah tidak tersedia. Pilih jam lain.
                        </p>
                      )}
                    </section>
                  )}
                </>
              )}
            </section>
            <aside
              aria-label="Ringkasan ballboy"
              className="space-y-5 border border-black/15 bg-white p-5 sm:p-6 lg:sticky lg:top-40"
            >
              <h2 className="text-lg font-medium">Pesanan ballboy</h2>
              {!selected.length ? (
                <p className="text-sm text-black/50">Pilih jam dan ballboy terlebih dahulu.</p>
              ) : (
                <ul className="divide-y divide-black/10">
                  {[...selected]
                    .sort((a, b) =>
                      `${a.date}${a.timeSlot}`.localeCompare(`${b.date}${b.timeSlot}`)
                    )
                    .map((item) => (
                      <li key={item.slotId} className="flex items-start justify-between gap-3 py-3">
                        <div>
                          <p className="text-sm font-medium">{item.ballboyName}</p>
                          <p className="mt-1 text-xs text-black/50">
                            {dayjs(item.date).format('DD MMM YYYY')} · {item.timeSlot}
                          </p>
                          <p className="mt-1 text-sm text-[#ad422b]">{currency(item.price)}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Hapus ${item.ballboyName} ${item.date} ${item.timeSlot}`}
                          onClick={() => remove(item.slotId)}
                          className="p-1 text-black/50"
                        >
                          <X className="size-4" />
                        </button>
                      </li>
                    ))}
                </ul>
              )}
              {selected.length > 0 && invalid && (
                <p role="alert" className="text-xs text-red-700">
                  Ada jam yang sudah tidak tersedia. Hapus pilihan tersebut dan pilih ulang.
                </p>
              )}
              <div className="flex justify-between border-t border-black/15 pt-4 text-sm">
                <span>Subtotal · {selected.length} jam</span>
                <span className="font-medium">{currency(total)}</span>
              </div>
              <Button
                className="h-12 w-full rounded-full bg-black text-white"
                disabled={
                  !selected.length ||
                  invalid ||
                  availability.isError ||
                  availability.isFetching ||
                  !withinWindow
                }
                onClick={() => {
                  cart.setItems(branch.id, selected);
                  router.push('/add-ons/checkout');
                }}
              >
                Lanjut ke pembayaran
              </Button>
              <p className="text-xs leading-relaxed text-black/45">
                Pemesanan ini khusus layanan ballboy. Biaya lapangan dibeli terpisah.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
