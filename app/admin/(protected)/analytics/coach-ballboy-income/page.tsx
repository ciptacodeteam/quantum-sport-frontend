'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { IconDownload } from '@tabler/icons-react';
import { toast } from 'sonner';
import AppSectionHeader from '@/components/ui/app-section-header';
import DateRangeInput from '@/components/ui/date-range-input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { getServiceIncomeApi, exportServiceIncomeApi } from '@/api/admin/analytics';
import { getApiErrorMessage } from '@/lib/api-error';
import ServiceIncomeSection from '@/components/admin/analytics/ServiceIncomeSection';
import type { ServiceIncomeFilters } from '@/types/service-income';

export default function CoachBallboyIncomePage() {
  const [date, setDate] = useState<DateRange | undefined>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  }));
  const [filters, setFilters] = useState<ServiceIncomeFilters>({});
  const [exporting, setExporting] = useState(false);
  const startDate = date?.from
    ? new Date(`${format(date.from, 'yyyy-MM-dd')}T00:00:00+07:00`).toISOString()
    : '';
  const endDate = date?.from
    ? new Date(`${format(date.to ?? date.from, 'yyyy-MM-dd')}T23:59:59.999+07:00`).toISOString()
    : '';
  const query = useQuery({
    queryKey: ['admin', 'analytics', 'coach-ballboy-income', startDate, endDate, filters],
    queryFn: () => getServiceIncomeApi(startDate, endDate, filters),
    enabled: !!startDate && !!endDate,
    placeholderData: keepPreviousData
  });
  const setFilter = (key: keyof ServiceIncomeFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value === 'all' ? undefined : value }));
  const exportReport = async () => {
    setExporting(true);
    try {
      const blob = await exportServiceIncomeApi(startDate, endDate, filters);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `pendapatan-coach-ballboy-${format(date!.from!, 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Laporan berhasil diekspor.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal mengekspor laporan.'));
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AppSectionHeader
        title="Income Layanan"
        description="Rekap pembayaran jasa dan hak pendapatan 100% untuk masing-masing club."
        className="mb-0 gap-4 pb-0 sm:items-center"
      >
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeInput
            value={date}
            onValueChange={(range) => {
              setDate(range ?? undefined);
              setFilters({});
            }}
          />
          <Button
            variant="outline"
            disabled={!query.data || query.isFetching || query.isError || exporting}
            onClick={() => void exportReport()}
          >
            <IconDownload className="size-4" />
            {exporting ? 'Mengekspor…' : 'Export Excel'}
          </Button>
        </div>
      </AppSectionHeader>

      <Card className="py-5">
        <CardContent className="space-y-4 px-6 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Filter laporan</h2>
            {Object.values(filters).some(Boolean) && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                Reset filter
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="service-income-type">Jenis jasa</Label>
              <Select
                value={filters.service ?? 'all'}
                onValueChange={(value) => setFilter('service', value)}
              >
                <SelectTrigger id="service-income-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Coach & Ballboy</SelectItem>
                  <SelectItem value="COACH">Coach</SelectItem>
                  <SelectItem value="BALLBOY">Ballboy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-income-club">Club / Grup Coaching</Label>
              <Select
                value={filters.clubId ?? 'all'}
                onValueChange={(value) => setFilter('clubId', value)}
              >
                <SelectTrigger id="service-income-club" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua club</SelectItem>
                  {(query.data?.options.clubs ?? []).map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-income-staff">Coach / Ballboy</Label>
              <Select
                value={filters.staffId ?? 'all'}
                onValueChange={(value) => setFilter('staffId', value)}
              >
                <SelectTrigger id="service-income-staff" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua petugas</SelectItem>
                  {(query.data?.options.staff ?? []).map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Mengikuti cabang yang dipilih di navigasi admin. Periode menggunakan tanggal pembayaran
            (WIB), maksimal 366 hari.
          </p>
        </CardContent>
      </Card>

      {!startDate ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Pilih periode pembayaran untuk melihat laporan.
          </CardContent>
        </Card>
      ) : query.isError ? (
        <Card role="alert">
          <CardContent className="space-y-3 py-8">
            <p className="text-sm font-medium">Laporan belum dapat dimuat</p>
            <p className="text-muted-foreground text-sm">
              {getApiErrorMessage(query.error, 'Terjadi kesalahan saat mengambil pendapatan jasa.')}
            </p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ServiceIncomeSection
          key={`${startDate}:${endDate}:${JSON.stringify(filters)}`}
          data={query.data}
          isLoading={query.isPending || query.isPlaceholderData}
        />
      )}
    </div>
  );
}
