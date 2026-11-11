'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock3,
  Save,
  Users,
  UserRound,
  CalendarDays,
  History,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { saveTariffPeriod } from '@/api/tariff-period';
import { useTariffPeriods } from '@/hooks/useTariffPeriods';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';
import { branchSupportsTennis } from '@/lib/court-branch-policy';
import {
  formatTariffHour,
  jakartaToday,
  resolveTariffPeriod,
  type TariffBands,
  type TariffRule
} from '@/lib/tariff-period';
import { handleMutationError } from '@/lib/handle-mutation-error';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DatePickerInput from '@/components/ui/date-picker-input';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function DiscountField({
  id,
  label,
  value,
  onChange
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm">
          Rp
        </span>
        <Input
          id={id}
          type="number"
          min={0}
          max={2147483647}
          step={1}
          required
          className="h-12 [appearance:textfield] rounded-lg pl-12 tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={focused && value === 0 ? '' : value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
        />
      </div>
    </Field>
  );
}

function EditorHeading({
  step,
  title,
  description
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold">
        {step}
      </span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function TariffEditor({ rules, sport }: { rules: TariffRule[]; sport: 'PADEL' | 'TENNIS' }) {
  const sportLabel = sport === 'PADEL' ? 'Padel' : 'Tennis';
  const today = jakartaToday();
  const active = resolveTariffPeriod(rules, today, sport, false);
  const [happyAllDayDays, setHappyAllDayDays] = useState<number[]>(active.happyAllDayDays ?? []);
  const [bands, setBands] = useState<TariffBands>(active);
  const [happyCoachDiscount, setHappyCoachDiscount] = useState(active.happyCoachDiscount ?? 0);
  const [peakCoachDiscount, setPeakCoachDiscount] = useState(active.peakCoachDiscount ?? 0);
  const [inHouseEnabled, setInHouseEnabled] = useState(
    active.happyInHouseCoachDiscount != null || active.peakInHouseCoachDiscount != null
  );
  const [happyInHouseCoachDiscount, setHappyInHouseCoachDiscount] = useState(
    active.happyInHouseCoachDiscount ?? 0
  );
  const [peakInHouseCoachDiscount, setPeakInHouseCoachDiscount] = useState(
    active.peakInHouseCoachDiscount ?? 0
  );
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveTariffPeriod,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['tariff-periods'] });
      client.invalidateQueries({ queryKey: ['admin', 'courts'] });
      client.invalidateQueries({ queryKey: ['courts'] });
      client.invalidateQueries({ queryKey: ['admin', 'booking-coaches'] });
      client.invalidateQueries({ queryKey: ['admin', 'inhouse'] });
      toast.success('Pengaturan jam tarif berhasil disimpan.');
    },
    onError: (error) =>
      handleMutationError(error, {
        fallbackMessage: 'Gagal menyimpan jam tarif. Silakan coba lagi.'
      })
  });
  const validDiscounts = [
    happyCoachDiscount,
    peakCoachDiscount,
    ...(inHouseEnabled ? [happyInHouseCoachDiscount, peakInHouseCoachDiscount] : [])
  ].every((value) => Number.isInteger(value) && value >= 0 && value <= 2147483647);
  const validHours =
    bands.happyEnd > bands.happyStart &&
    bands.peakEnd > bands.peakStart &&
    (bands.happyEnd === bands.peakStart || bands.peakEnd === bands.happyStart);
  const valid = validDiscounts && validHours;
  const history = rules
    .filter((rule) => rule.sport === sport)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  const current = history.find((rule) => rule.effectiveFrom.slice(0, 10) <= today)?.id;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">{sportLabel} · WIB</Badge>
        <h2 className="text-xl font-semibold tracking-tight">Jam bermain & potongan coaching</h2>
        <p className="text-muted-foreground text-sm">
          Tentukan rentang tarif, bedakan potongan tiap jenis coach, lalu pilih tanggal mulai
          berlaku. Pengaturan khusus {sportLabel} pada cabang yang dipilih.
        </p>
      </div>
      <div className="bg-muted/20 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border p-5 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Clock3 className="text-primary size-4" />
          Aturan aktif hari ini
        </span>
        <span>
          Happy Hour{' '}
          <strong>
            {formatTariffHour(active.happyStart)} – {formatTariffHour(active.happyEnd)}
          </strong>
        </span>
        <span>
          Peak Hour{' '}
          <strong>
            {formatTariffHour(active.peakStart)} – {formatTariffHour(active.peakEnd)}
          </strong>
        </span>
        {!!active.happyAllDayDays?.length && (
          <span>
            Happy Hour sepanjang hari:{' '}
            {active.happyAllDayDays
              .map(
                (day) => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][day - 1]
              )
              .join(', ')}
          </span>
        )}
        {!current && <Badge variant="outline">Bawaan sistem</Badge>}
      </div>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid && effectiveFrom >= jakartaToday())
            mutation.mutate({
              happyAllDayDays,
              happyStart: bands.happyStart,
              happyEnd: bands.happyEnd,
              peakStart: bands.peakStart,
              peakEnd: bands.peakEnd,
              happyCoachDiscount,
              peakCoachDiscount,
              happyInHouseCoachDiscount: inHouseEnabled ? happyInHouseCoachDiscount : null,
              peakInHouseCoachDiscount: inHouseEnabled ? peakInHouseCoachDiscount : null,
              effectiveFrom,
              sport
            });
        }}
      >
        <fieldset disabled={mutation.isPending} className="min-w-0 space-y-5">
          <section className="bg-background rounded-2xl border p-5 sm:p-7">
            <EditorHeading
              step="01"
              title="Rentang jam tarif"
              description="Happy Hour dan Peak Hour menjadi acuan tarif lapangan serta potongan coaching. Kedua rentang harus bersebelahan."
            />
            <div className="grid gap-5 md:grid-cols-2">
              {(['happy', 'peak'] as const).map((band) => (
                <section key={band} className="bg-muted/15 space-y-5 rounded-xl border p-5">
                  <div className="space-y-1 border-b pb-4">
                    <h2 className="font-semibold">
                      {band === 'happy' ? 'Happy Hour' : 'Peak Hour'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Rentang waktu untuk tarif {band === 'happy' ? 'Happy Hour' : 'Peak Hour'}{' '}
                      lapangan.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(['Start', 'End'] as const).map((edge) => {
                      const field = `${band}${edge}` as keyof TariffBands;
                      return (
                        <Field key={edge}>
                          <FieldLabel htmlFor={field}>
                            {edge === 'Start' ? 'Jam Mulai' : 'Jam Selesai'}
                          </FieldLabel>
                          <Select
                            value={String(bands[field])}
                            onValueChange={(value) =>
                              setBands((old) => ({ ...old, [field]: Number(value) }))
                            }
                          >
                            <SelectTrigger id={field} className="h-10 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(
                                { length: 24 },
                                (_, i) => i + (edge === 'End' ? 1 : 0)
                              ).map((hour) => (
                                <SelectItem key={hour} value={String(hour)}>
                                  {formatTariffHour(hour)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <section className="mt-5 space-y-4 border-t pt-5">
              <div className="space-y-1">
                <h2 className="font-semibold">Hari Happy Hour Sepanjang Hari</h2>
                <p className="text-muted-foreground text-sm">
                  Hari yang dipilih memakai harga dan potongan coaching Happy Hour sepanjang jam
                  operasional. Hari lainnya mengikuti rentang jam di atas. Jam tutup tetap mengikuti
                  jadwal lapangan.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(
                  (day, index) => (
                    <label key={day} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary size-4"
                        checked={happyAllDayDays.includes(index + 1)}
                        onChange={(event) =>
                          setHappyAllDayDays((days) =>
                            event.target.checked
                              ? [...days, index + 1].sort((a, b) => a - b)
                              : days.filter((value) => value !== index + 1)
                          )
                        }
                      />
                      {day}
                    </label>
                  )
                )}
              </div>
            </section>
          </section>
          {!valid && (
            <p role="alert" className="text-destructive text-sm">
              {!validHours
                ? 'Jam selesai harus setelah jam mulai. Happy Hour dan Peak Hour harus bersebelahan, tanpa tumpang tindih atau jeda.'
                : 'Nominal potongan harus berupa bilangan bulat dari 0 sampai Rp2.147.483.647.'}
            </p>
          )}
          <section
            aria-label={`Potongan coaching ${sportLabel}`}
            className="bg-background rounded-2xl border p-5 sm:p-7"
          >
            <EditorHeading
              step="02"
              title="Potongan lapangan coaching"
              description="Atur nominal per jam untuk setiap jenis coach. Potongan hanya berlaku pada jam lapangan yang didampingi coach; nominal maksimal sebesar harga lapangan."
            />
            <div className="grid items-start gap-5 xl:grid-cols-2">
              <section
                aria-labelledby="club-discount-title"
                className="overflow-hidden rounded-xl border"
              >
                <div className="bg-muted/25 flex items-start gap-3 border-b p-5">
                  <span className="bg-background flex size-10 shrink-0 items-center justify-center rounded-xl border">
                    <Users className="size-5" />
                  </span>
                  <div>
                    <h3 id="club-discount-title" className="font-semibold">
                      Coach Club
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Potongan untuk pemesanan coach club.
                    </p>
                  </div>
                </div>
                <div className="space-y-5 p-5">
                  <DiscountField
                    id="happyCoachDiscount"
                    label="Potongan Coach Club Happy Hour (Rp)"
                    value={happyCoachDiscount}
                    onChange={setHappyCoachDiscount}
                  />
                  <DiscountField
                    id="peakCoachDiscount"
                    label="Potongan Coach Club Peak Hour (Rp)"
                    value={peakCoachDiscount}
                    onChange={setPeakCoachDiscount}
                  />
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Isi 0 untuk menonaktifkan potongan. Tidak digabung dengan slot yang ditanggung
                    Value Pack.
                  </p>
                </div>
              </section>
              <section
                aria-labelledby="inhouse-discount-title"
                className="overflow-hidden rounded-xl border"
              >
                <div className="bg-primary/5 flex items-start gap-3 border-b p-5">
                  <span className="bg-background text-primary flex size-10 shrink-0 items-center justify-center rounded-xl border">
                    <UserRound className="size-5" />
                  </span>
                  <div>
                    <h3 id="inhouse-discount-title" className="font-semibold">
                      Coach In-house
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Potongan terpisah untuk paket dan coaching satuan.
                    </p>
                  </div>
                </div>
                <div className="space-y-5 p-5">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
                    <input
                      type="checkbox"
                      className="accent-primary mt-0.5 size-4 shrink-0"
                      checked={inHouseEnabled}
                      onChange={(event) => setInHouseEnabled(event.target.checked)}
                    />
                    <span>
                      <span className="font-medium">Gunakan potongan in-house terpisah</span>
                      <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                        Jika belum diaktifkan, lapangan mengikuti ketentuan paket sebelumnya.
                      </span>
                    </span>
                  </label>
                  {inHouseEnabled ? (
                    <>
                      <DiscountField
                        id="happyInHouseCoachDiscount"
                        label="Potongan Coach In-house Happy Hour (Rp)"
                        value={happyInHouseCoachDiscount}
                        onChange={setHappyInHouseCoachDiscount}
                      />
                      <DiscountField
                        id="peakInHouseCoachDiscount"
                        label="Potongan Coach In-house Peak Hour (Rp)"
                        value={peakInHouseCoachDiscount}
                        onChange={setPeakInHouseCoachDiscount}
                      />
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Isi 0 jika tidak ada potongan. Bagian lapangan yang sudah dibayar lewat
                        paket diperhitungkan; customer hanya membayar selisih jika ada. Pembagian
                        harga paket tetap mengikuti Paket & Tarif.
                      </p>
                    </>
                  ) : (
                    <div className="bg-muted/20 rounded-lg p-4 text-sm">
                      <p className="font-medium">Mengikuti ketentuan paket</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        Aktifkan untuk memakai nominal Happy Hour dan Peak Hour yang berbeda dari
                        Coach Club.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
            <div className="bg-muted/25 text-muted-foreground mt-5 flex items-start gap-2 rounded-lg p-3 text-xs leading-relaxed">
              <ArrowDownRight className="size-4 shrink-0" />
              Berlaku untuk booking admin/kasir sesuai cabang, olahraga, dan tanggal bermain. Satu
              jam lapangan hanya memakai satu jenis potongan coaching.
            </div>
          </section>
          <section className="bg-background space-y-5 rounded-2xl border p-5 sm:p-7">
            <EditorHeading
              step="03"
              title="Tanggal mulai berlaku"
              description="Simpan perubahan untuk tanggal bermain mulai hari yang dipilih. Harga pada transaksi yang sudah dibuat tetap tersimpan."
            />
            <Field className="sm:max-w-xs">
              <FieldLabel htmlFor="effectiveFrom">Mulai Berlaku</FieldLabel>
              <DatePickerInput
                id="effectiveFrom"
                minDate={dayjs(today).startOf('day').toDate()}
                value={dayjs(effectiveFrom).toDate()}
                onValueChange={(date) => {
                  if (date) setEffectiveFrom(dayjs(date).format('YYYY-MM-DD'));
                }}
                className="h-10"
              />
            </Field>
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>
                Seluruh waktu menggunakan WIB. Rentang diatur per jam penuh sesuai durasi slot
                lapangan.
              </p>
              <p>
                Jadwal rolling membuka slot dalam kedua rentang ini. Slot di luar rentang akan
                ditutup oleh aturan jadwal.
              </p>
              <p>
                Harga mengikuti pengaturan masing-masing lapangan dan aturan bulk rolling. Booking
                yang sudah ada tetap mempertahankan jadwal dan harganya.
              </p>
              <p>
                Value Pack Happy Hour dan Peak Hour mengikuti cabang, olahraga, dan tanggal bermain.
                All Hour tetap mencakup semua jam operasional.
              </p>
            </div>
          </section>
        </fieldset>
        <div className="bg-background/95 sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-sm backdrop-blur-sm">
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarDays className="size-4" />
            Berlaku mulai {dayjs(effectiveFrom).format('DD/MM/YYYY')} · {sportLabel}
          </p>
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!valid || !effectiveFrom || effectiveFrom < today}
          >
            <Save />
            Simpan Aturan Jam Tarif
          </Button>
        </div>
      </form>
      <details className="group overflow-hidden rounded-2xl border">
        <summary className="marker:text-muted-foreground cursor-pointer p-5">
          <span className="inline-flex items-center gap-2 font-semibold">
            <History className="size-4" />
            Riwayat & Aturan Terjadwal <Badge variant="outline">{history.length}</Badge>
          </span>
          <p className="text-muted-foreground mt-1 text-sm">
            Aturan terbaru yang sudah mulai berlaku menjadi acuan untuk tanggal bermain.
          </p>
        </summary>
        {history.length ? (
          <div className="divide-y">
            {history.map((rule) => (
              <div key={rule.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Mulai {rule.effectiveFrom.slice(0, 10).split('-').reverse().join('/')}
                    </span>
                    <Badge variant={rule.id === current ? 'lightSuccess' : 'lightNeutral'}>
                      {rule.effectiveFrom.slice(0, 10) > today
                        ? 'Terjadwal'
                        : rule.id === current
                          ? 'Aktif'
                          : 'Riwayat'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Happy Hour {formatTariffHour(rule.happyStart)}–{formatTariffHour(rule.happyEnd)}{' '}
                    · Peak Hour {formatTariffHour(rule.peakStart)}–{formatTariffHour(rule.peakEnd)}
                    {' · Club: Happy Hour Rp '}
                    {(rule.happyCoachDiscount ?? 0).toLocaleString('id-ID')}
                    {' / Peak Hour Rp '}
                    {(rule.peakCoachDiscount ?? 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    In-house:{' '}
                    {rule.happyInHouseCoachDiscount == null && rule.peakInHouseCoachDiscount == null
                      ? 'Mengikuti ketentuan paket'
                      : `Happy Hour Rp ${(rule.happyInHouseCoachDiscount ?? 0).toLocaleString('id-ID')} / Peak Hour Rp ${(rule.peakInHouseCoachDiscount ?? 0).toLocaleString('id-ID')}`}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Happy Hour sepanjang hari:{' '}
                    {(rule.happyAllDayDays ?? [])
                      .map(
                        (day) =>
                          ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][day - 1]
                      )
                      .join(', ') || 'Tidak ada'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBands(rule);
                    setHappyAllDayDays(rule.happyAllDayDays ?? []);
                    setHappyCoachDiscount(rule.happyCoachDiscount ?? 0);
                    setPeakCoachDiscount(rule.peakCoachDiscount ?? 0);
                    setInHouseEnabled(
                      rule.happyInHouseCoachDiscount != null ||
                        rule.peakInHouseCoachDiscount != null
                    );
                    setHappyInHouseCoachDiscount(rule.happyInHouseCoachDiscount ?? 0);
                    setPeakInHouseCoachDiscount(rule.peakInHouseCoachDiscount ?? 0);
                    setEffectiveFrom(
                      rule.effectiveFrom.slice(0, 10) < today
                        ? today
                        : rule.effectiveFrom.slice(0, 10)
                    );
                  }}
                >
                  {rule.effectiveFrom.slice(0, 10) >= today ? 'Edit Aturan' : 'Gunakan Aturan Ini'}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground p-5 text-sm">
            Belum ada aturan khusus. Sistem memakai Happy Hour 06:00–15:00 dan Peak Hour
            15:00–24:00.
          </p>
        )}
      </details>
    </div>
  );
}

export default function TariffPeriodPage() {
  const access = useRoleAccess({ allowedRoles: [ROLE.ADMIN] });
  const query = useTariffPeriods(true);
  const [choice, setChoice] = useState<'PADEL' | 'TENNIS'>('PADEL');
  const tennis = branchSupportsTennis(query.branchId);
  const sport = tennis ? choice : 'PADEL';
  return (
    <main className="w-full min-w-0">
      <Section className="gap-6">
        <SectionHeader>
          <SectionTitle title="Pengaturan Jam Tarif" />
          <SectionDescription description="Kelola jam bermain dan potongan lapangan Coach Club serta Coach In-house per cabang dan olahraga." />
        </SectionHeader>
        <SectionContent>
          {access.isLoading ? (
            <p>Memuat pengaturan...</p>
          ) : !access.hasAccess ? (
            <p role="alert">Anda tidak memiliki akses ke pengaturan ini.</p>
          ) : !query.branchId ? (
            <p className="rounded-xl border p-6">
              Pilih satu cabang pada pemilih cabang di header untuk mengatur jam tarif.
            </p>
          ) : query.isPending ? (
            <p>Memuat aturan jam tarif...</p>
          ) : query.isError ? (
            <div role="alert" className="space-y-3 rounded-xl border p-6">
              <p>Pengaturan jam tarif gagal dimuat.</p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                Coba Lagi
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <Tabs value={sport} onValueChange={(value) => setChoice(value as 'PADEL' | 'TENNIS')}>
                <TabsList aria-label="Kategori olahraga" className="h-auto w-full sm:w-fit">
                  <TabsTrigger
                    value="PADEL"
                    className="h-auto px-3 py-2 text-center whitespace-normal"
                  >
                    Tarif &amp; Potongan Padel
                  </TabsTrigger>
                  {tennis && (
                    <TabsTrigger
                      value="TENNIS"
                      className="h-auto px-3 py-2 text-center whitespace-normal"
                    >
                      Tarif &amp; Potongan Tennis
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
              <TariffEditor key={`${query.branchId}-${sport}`} rules={query.rules} sport={sport} />
            </div>
          )}
        </SectionContent>
      </Section>
    </main>
  );
}
