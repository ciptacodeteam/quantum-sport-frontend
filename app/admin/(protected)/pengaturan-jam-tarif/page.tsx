'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock3, Save } from 'lucide-react';
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

function TariffEditor({ rules, sport }: { rules: TariffRule[]; sport: 'PADEL' | 'TENNIS' }) {
  const today = jakartaToday();
  const active = resolveTariffPeriod(rules, today, sport);
  const [bands, setBands] = useState<TariffBands>(active);
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveTariffPeriod,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['tariff-periods'] });
      client.invalidateQueries({ queryKey: ['admin', 'courts'] });
      client.invalidateQueries({ queryKey: ['courts'] });
      toast.success('Pengaturan jam tarif berhasil disimpan.');
    },
    onError: (error) =>
      handleMutationError(error, {
        fallbackMessage: 'Gagal menyimpan jam tarif. Silakan coba lagi.'
      })
  });
  const valid =
    bands.happyEnd > bands.happyStart &&
    bands.peakEnd > bands.peakStart &&
    (bands.happyEnd === bands.peakStart || bands.peakEnd === bands.happyStart);
  const history = rules
    .filter((rule) => rule.sport === sport)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  const current = history.find((rule) => rule.effectiveFrom.slice(0, 10) <= today)?.id;
  return (
    <div className="space-y-6">
      <div className="bg-muted/30 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border p-4 text-sm">
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
        {!current && <Badge variant="outline">Bawaan sistem</Badge>}
      </div>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid && effectiveFrom >= jakartaToday())
            mutation.mutate({
              happyStart: bands.happyStart,
              happyEnd: bands.happyEnd,
              peakStart: bands.peakStart,
              peakEnd: bands.peakEnd,
              effectiveFrom,
              sport
            });
        }}
      >
        <fieldset disabled={mutation.isPending} className="min-w-0 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            {(['happy', 'peak'] as const).map((band) => (
              <section key={band} className="space-y-5 rounded-xl border p-5 sm:p-6">
                <div className="space-y-1 border-b pb-4">
                  <h2 className="font-semibold">{band === 'happy' ? 'Happy Hour' : 'Peak Hour'}</h2>
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
                            {Array.from({ length: 24 }, (_, i) => i + (edge === 'End' ? 1 : 0)).map(
                              (hour) => (
                                <SelectItem key={hour} value={String(hour)}>
                                  {formatTariffHour(hour)}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </Field>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          {!valid && (
            <p role="alert" className="text-destructive text-sm">
              Jam selesai harus setelah jam mulai. Happy Hour dan Peak Hour harus bersebelahan,
              tanpa tumpang tindih atau jeda.
            </p>
          )}
          <section className="space-y-4 rounded-xl border p-5 sm:p-6">
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
        <div className="flex justify-end border-t pt-5">
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
      <section className="overflow-hidden rounded-xl border">
        <div className="border-b p-5">
          <h2 className="font-semibold">Riwayat & Aturan Terjadwal</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Aturan terbaru yang sudah mulai berlaku menjadi acuan untuk tanggal bermain.
          </p>
        </div>
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
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBands(rule);
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
      </section>
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
          <SectionDescription description="Atur Happy Hour dan Peak Hour untuk cabang serta kategori olahraga yang dipilih." />
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
                <TabsList aria-label="Kategori olahraga">
                  <TabsTrigger value="PADEL">Padel</TabsTrigger>
                  {tennis && <TabsTrigger value="TENNIS">Tennis</TabsTrigger>}
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
