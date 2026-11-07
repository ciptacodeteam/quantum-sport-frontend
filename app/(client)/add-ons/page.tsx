'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CalendarDays, X } from 'lucide-react';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { DatePickerModal, DatePickerModalTrigger } from '@/components/ui/date-picker-modal';
import { getCourtBookingWindowApi } from '@/api/court';
import { getBallboyAvailabilityApi, getBallboysApi } from '@/api/ballboy';
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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [date, setDate] = useState(() => nowJakarta().format('YYYY-MM-DD'));
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
  const roster = useQuery({
    queryKey: ['ballboy', 'catalog', branch?.id, 'TENNIS'],
    queryFn: getBallboysApi,
    enabled: !!branch,
    refetchInterval: 60000,
    refetchOnWindowFocus: true
  });
  const dateList = useMemo(() => {
    if (!windowQuery.data) return [];
    const count = Math.min(
      367,
      Math.max(0, dayjs(windowQuery.data.endDate).diff(dayjs(today), 'day') + 1)
    );
    return Array.from({ length: count }, (_, index) =>
      dayjs(today).add(index, 'day').format('YYYY-MM-DD')
    );
  }, [today, windowQuery.data]);

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
    enabled: !!branch && date >= today && (!windowQuery.data || withinWindow),
    refetchInterval: 10000,
    refetchOnWindowFocus: true
  });
  const options = useMemo(
    () => availableBallboyHours(availability.data ?? [], date, now),
    [availability.data, date, now]
  );
  const slotMap = useMemo(
    () =>
      new Map(
        options.map((option) => [
          `${option.ballboy.id}|${parseScheduleDatetime(option.startAt).format('HH:mm')}`,
          option
        ])
      ),
    [options]
  );
  const dayItems = selected.filter((item) => item.date === date);
  const invalid =
    (!roster.isPending &&
      !roster.isError &&
      selected.some((item) => !roster.data?.some((person) => person.id === item.ballboyId))) ||
    selected.some(
      (item) => !item.startAt || parseScheduleDatetime(item.startAt).valueOf() <= now
    ) ||
    dayItems.some(
      (item) =>
        !options.some((option) => option.slotId === item.slotId && option.price === item.price)
    );
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
  const selectionList = !selected.length ? (
    <p className="text-sm text-black/50">Pilih jam dan ballboy terlebih dahulu.</p>
  ) : (
    <ul className="divide-y divide-black/10">
      {[...selected]
        .sort((a, b) => `${a.date}${a.timeSlot}`.localeCompare(`${b.date}${b.timeSlot}`))
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
  );

  return (
    <div className="min-h-dvh bg-[#f8f8f6] text-[#171717]">
      <MainHeader showBack backHref="/" />
      <main className="booking-page mx-auto mt-[76px] h-[calc(100dvh-76px)] w-full max-w-7xl overflow-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] text-[#171717] lg:mt-0 lg:h-auto lg:overflow-visible lg:px-8 lg:pt-40 lg:pb-16 xl:pt-32">
        <div className="mb-8 hidden max-w-xl lg:block">
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
          <div className="grid h-full min-h-0 min-w-0 items-start gap-4 lg:h-auto lg:grid-cols-[minmax(0,1fr)_300px]">
            <section
              className="flex h-full min-h-0 min-w-0 flex-col lg:h-auto"
              aria-label="Jadwal ballboy"
            >
              <div className="flex min-w-0 shrink-0 items-center gap-2 border-y border-black/15 bg-[#f8f8f6] p-3 lg:border">
                <DatePickerModal
                  value={dayjs(date).toDate()}
                  minDate={dayjs(today).toDate()}
                  maxDate={dayjs(windowQuery.data?.endDate ?? today).toDate()}
                  label="Pilih tanggal bermain"
                  onChange={(value) => {
                    if (!value) return;
                    const next = dayjs(value).format('YYYY-MM-DD');
                    if (next >= today && windowQuery.data && next <= windowQuery.data.endDate)
                      setDate(next);
                  }}
                >
                  <DatePickerModalTrigger>
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      aria-label="Pilih tanggal pemesanan"
                      disabled={!windowQuery.data || windowQuery.isError}
                      className="shrink-0 rounded-none border border-black/15 bg-white text-black hover:bg-black/5"
                    >
                      <CalendarDays className="size-5" />
                    </Button>
                  </DatePickerModalTrigger>
                </DatePickerModal>
                <span aria-hidden="true" className="mx-1 h-10 w-px shrink-0 bg-black/25" />
                <div
                  role="group"
                  aria-label="Tanggal booking ballboy"
                  className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1"
                >
                  {dateList.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={dayjs(value).format('DD MMM YYYY')}
                      aria-pressed={date === value}
                      onClick={() => setDate(value)}
                      className={cn(
                        'flex h-16 min-w-16 shrink-0 flex-col items-center justify-center border px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-black',
                        date === value
                          ? 'border-[#111111] bg-[#111111] text-white'
                          : 'border-transparent text-black/60 hover:border-black/15 hover:bg-white'
                      )}
                    >
                      <span className="text-xs">{dayjs(value).format('ddd')}</span>
                      <span className="mt-0.5 text-sm font-semibold">
                        {dayjs(value).format('DD MMM')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="my-4 hidden flex-wrap items-center justify-between gap-3 lg:flex">
                <div>
                  <h2 className="text-base font-medium">Jadwal Ballboy</h2>
                  <p className="mt-1 text-xs text-black/50">
                    {dayjs(date).format('dddd, DD MMM YYYY')} · {branch.name} · WIB
                  </p>
                </div>
                <span className="text-xs text-black/50">
                  Geser tabel untuk melihat semua ballboy
                </span>
              </div>
              <div
                aria-label="Keterangan jadwal"
                className="flex shrink-0 flex-wrap gap-5 px-5 py-4 text-[11px] text-black/55 lg:px-0"
              >
                <span className="flex items-center gap-2">
                  <span className="size-2.5 border border-black/25 bg-white" />
                  Tersedia
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 bg-[#111111]" />
                  Dipilih
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 bg-[#e5e5e2]" />
                  Tidak tersedia
                </span>
              </div>
              {selected.length > 0 && invalid && (
                <div role="alert" className="shrink-0 px-5 pb-3 text-xs text-red-700 lg:px-0">
                  Ada jam yang sudah tidak tersedia atau harganya berubah. Hapus pilihan tersebut
                  dan pilih ulang.
                  <button
                    type="button"
                    className="ml-1 underline"
                    onClick={() => setSummaryOpen(true)}
                  >
                    Lihat pilihan
                  </button>
                </div>
              )}
              {windowQuery.isError || availability.isError || roster.isError ? (
                <div role="alert" className="space-y-3 text-sm text-red-700">
                  <p>Jadwal ballboy belum dapat dimuat.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void windowQuery.refetch();
                      void availability.refetch();
                      void roster.refetch();
                    }}
                  >
                    Coba lagi
                  </Button>
                </div>
              ) : windowQuery.isPending ||
                roster.isPending ||
                (withinWindow && availability.isPending) ? (
                <p role="status" className="text-sm text-black/50">
                  Memuat jadwal ballboy...
                </p>
              ) : !withinWindow ? (
                <p role="status" className="text-sm text-black/50">
                  Pilih tanggal dalam periode pemesanan yang tersedia.
                </p>
              ) : !roster.data?.length ? (
                <p role="status" className="text-sm text-black/50">
                  Belum ada ballboy yang dapat dipesan di cabang ini.
                </p>
              ) : (
                <>
                  <p className="mb-3 hidden text-xs text-black/50 lg:block">
                    Klik harga pada jam yang diinginkan. Pilih satu ballboy untuk setiap jam;
                    pilihan pada tanggal lain tetap tersimpan.
                  </p>
                  <div
                    className="min-h-0 flex-1 overflow-auto border-y border-black/15 lg:max-h-[640px] lg:flex-none lg:border"
                    aria-busy={availability.isFetching}
                  >
                    <table
                      aria-label="Jadwal booking ballboy"
                      className="w-full border-separate border-spacing-0 text-center"
                    >
                      <thead className="sticky top-0 z-20 bg-[#f8f8f6]">
                        <tr>
                          <th
                            scope="col"
                            className="sticky left-0 z-30 w-20 border-r border-b border-black/10 bg-[#f8f8f6] px-4 py-4 text-left text-[10px] font-medium tracking-wider text-black/45 uppercase"
                          >
                            Waktu
                          </th>
                          {roster.data.map((person) => (
                            <th
                              key={person.id}
                              scope="col"
                              className="min-w-[150px] border-r border-b border-black/10 bg-[#f8f8f6] px-3 py-4 text-xs font-medium"
                            >
                              {person.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {hours.map((time) => (
                          <tr key={time}>
                            <th
                              scope="row"
                              className="sticky left-0 z-10 border-r border-b border-black/10 bg-[#f8f8f6] px-4 py-2 text-left text-xs font-medium tabular-nums"
                            >
                              {time}
                            </th>
                            {roster.data.map((person) => {
                              const option = slotMap.get(`${person.id}|${time}`);
                              const chosen =
                                !!option && dayItems.some((item) => item.slotId === option.slotId);
                              return (
                                <td
                                  key={person.id}
                                  className="border-r border-b border-black/10 p-1.5"
                                >
                                  <button
                                    type="button"
                                    disabled={!option}
                                    aria-pressed={chosen}
                                    aria-label={`${person.name}, ${time}, ${!option ? 'Tidak tersedia' : chosen ? 'Dipilih' : 'Tersedia'}`}
                                    onClick={() => {
                                      if (option) toggle(option);
                                    }}
                                    className={cn(
                                      'flex h-16 w-full flex-col items-start justify-center gap-1 border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
                                      !option
                                        ? 'cursor-not-allowed border-transparent bg-[#eaeae6] text-black/35'
                                        : chosen
                                          ? 'border-[#111111] bg-[#111111] text-white'
                                          : 'border-black/15 bg-white text-[#171717] hover:border-[#ad422b] hover:bg-[#ad422b]/5'
                                    )}
                                  >
                                    <span className="text-sm font-medium tabular-nums">
                                      {option ? currency(option.price) : '—'}
                                    </span>
                                    <span className="text-[10px] font-normal">
                                      {!option ? 'Tidak tersedia' : chosen ? 'Dipilih' : 'per jam'}
                                    </span>
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!options.length && (
                    <p role="status" className="text-sm text-black/50">
                      Tidak ada ballboy tersedia pada tanggal ini.
                    </p>
                  )}
                </>
              )}
            </section>
            <aside
              aria-label="Ringkasan ballboy"
              className="fixed inset-x-0 bottom-0 z-40 h-[calc(5rem+env(safe-area-inset-bottom))] border-t border-black/15 bg-[#f8f8f6] pb-[env(safe-area-inset-bottom)] lg:sticky lg:inset-x-auto lg:top-28 lg:bottom-auto lg:h-auto lg:border lg:p-6"
            >
              <h2 className="mb-5 hidden text-lg font-medium lg:block">Pesanan ballboy</h2>
              <div className="hidden lg:block">{selectionList}</div>
              <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:mt-5 lg:h-auto lg:flex-col lg:items-stretch lg:border-t lg:border-black/15 lg:px-0 lg:pt-4">
                <button
                  type="button"
                  aria-label="Lihat pilihan ballboy"
                  disabled={!selected.length}
                  onClick={() => setSummaryOpen(true)}
                  className="min-w-0 text-left"
                >
                  <span className="block text-[11px] text-black/50">
                    Subtotal · {selected.length} slot
                  </span>
                  <span className="mt-1 block text-xl font-medium tracking-tight text-[#171717]">
                    {currency(total)}
                  </span>
                </button>
                <Button
                  aria-label="Lanjut ke pembayaran"
                  className="h-12 shrink-0 rounded-full bg-[#111111] px-5 text-sm text-white hover:bg-black/80 disabled:bg-black/15 disabled:text-black/40 disabled:opacity-100 lg:w-full"
                  disabled={
                    !selected.length ||
                    invalid ||
                    availability.isError ||
                    roster.isError ||
                    roster.isPending ||
                    availability.isFetching ||
                    !withinWindow
                  }
                  onClick={() => {
                    cart.setItems(branch.id, selected);
                    router.push('/add-ons/checkout');
                  }}
                >
                  Lanjutkan{' '}
                  <ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </div>
              <p className="mt-4 hidden text-xs leading-relaxed text-black/45 lg:block">
                Pemesanan ini khusus layanan ballboy. Biaya lapangan dibeli terpisah.
              </p>
            </aside>
            <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
              <SheetContent
                side="bottom"
                className="max-h-[80dvh] overflow-y-auto bg-[#f8f8f6] pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
              >
                <SheetHeader>
                  <SheetTitle>Pesanan ballboy</SheetTitle>
                  <SheetDescription>
                    Periksa pilihan jadwal Anda atau hapus slot yang ingin diganti.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-5">{selectionList}</div>
                <div className="flex items-center justify-between border-t border-black/15 px-5 pt-4 text-sm">
                  <span>{selected.length} slot</span>
                  <span>{currency(total)}</span>
                </div>
                <Button
                  variant="outline"
                  className="mx-5 rounded-full"
                  onClick={() => setSummaryOpen(false)}
                >
                  Kembali ke jadwal
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </main>
    </div>
  );
}
