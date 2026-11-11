'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getAnalyticsDateRange } from '@/lib/analytics-date-range';
import type { DateRange } from 'react-day-picker';

import AppSectionHeader from '@/components/ui/app-section-header';
import DateRangeInput from '@/components/ui/date-range-input';
import { incomeBySourceQueryOptions } from '@/queries/admin/analytics';
import { exportIncomeBySourceApi } from '@/api/admin/analytics';
import { Button } from '@/components/ui/button';
import { IconFileExcel } from '@tabler/icons-react';
import { toast } from 'sonner';
import dayjs from '@/lib/dayjs';
import IncomeBySourceSection from '@/components/admin/analytics/IncomeBySourceSection';

export default function IncomeBySourcePage() {
  const [date, setDate] = useState<DateRange | undefined>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  }));

  const [filtersReady, setFiltersReady] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('income-by-source-date');
      if (saved) {
        const range = JSON.parse(saved);
        const from = new Date(range.from);
        const to = new Date(range.to ?? range.from);
        if (Number.isFinite(from.getTime()) && Number.isFinite(to.getTime()) && from <= to) {
          setDate({ from, to });
        }
      }
    } catch {
      // Keep the current-month default if browser storage is unavailable or invalid.
    }
    setFiltersReady(true);
  }, []);

  const changeDate = (range: DateRange | undefined | null) => {
    const selected = range?.from ? { from: range.from, to: range.to ?? range.from } : undefined;
    setDate(selected);
    try {
      if (selected) sessionStorage.setItem('income-by-source-date', JSON.stringify(selected));
      else sessionStorage.removeItem('income-by-source-date');
    } catch {
      // Filtering remains available when browser storage is disabled.
    }
  };

  const { startDate, endDate } = getAnalyticsDateRange(date);

  const { data: incomeData, isLoading } = useQuery({
    ...incomeBySourceQueryOptions(startDate, endDate),
    enabled: filtersReady
  });

  const [exporting, setExporting] = useState(false);
  const exportInFlight = useRef(false);
  const exportExcel = async () => {
    if (exportInFlight.current || !filtersReady) return;
    exportInFlight.current = true;
    setExporting(true);
    let url: string | undefined;
    try {
      const blob = await exportIncomeBySourceApi({ startDate, endDate });
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const period =
        startDate && endDate
          ? [startDate, endDate]
              .map((value) => dayjs(value).tz('Asia/Jakarta').format('YYYY-MM-DD'))
              .join('-')
          : 'periode-default';
      link.download = `income-by-source-${period}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laporan Income by Source berhasil diekspor.');
    } catch {
      toast.error('Export Excel gagal. Silakan coba lagi.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      exportInFlight.current = false;
      setExporting(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AppSectionHeader
        title="Income by Source"
        description="Revenue breakdown by booking channels and membership"
        className="mb-0 gap-4 pb-0 sm:items-center"
      >
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeInput value={date} onValueChange={changeDate} allowSingleDay />
          <Button
            variant="outline"
            disabled={!filtersReady || exporting}
            onClick={() => void exportExcel()}
            title="Export seluruh transaksi pada periode dan cabang yang dipilih"
          >
            <IconFileExcel className="size-4" />
            {exporting ? 'Mengekspor…' : 'Export Excel'}
          </Button>
        </div>
      </AppSectionHeader>

      <IncomeBySourceSection data={incomeData} isLoading={isLoading} />
    </div>
  );
}
