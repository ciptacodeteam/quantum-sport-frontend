'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, subDays } from 'date-fns';
import { getAnalyticsDateRange } from '@/lib/analytics-date-range';
import type { DateRange } from 'react-day-picker';

import AppSectionHeader from '@/components/ui/app-section-header';
import DateRangeInput from '@/components/ui/date-range-input';
import { incomeBySourceQueryOptions } from '@/queries/admin/analytics';
import IncomeBySourceSection from '@/components/admin/analytics/IncomeBySourceSection';

export default function IncomeBySourcePage() {
  const [date, setDate] = useState<DateRange | undefined>(() => ({
    from: subDays(startOfDay(new Date()), 29),
    to: startOfDay(new Date())
  }));

  const { startDate, endDate } = getAnalyticsDateRange(date);

  const { data: incomeData, isLoading } = useQuery(incomeBySourceQueryOptions(startDate, endDate));

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AppSectionHeader
        title="Income by Source"
        description="Revenue breakdown by booking channels and membership"
        className="mb-0 gap-4 pb-0 sm:items-center"
      >
        <DateRangeInput value={date} onValueChange={(r) => setDate(r ?? undefined)} />
      </AppSectionHeader>

      <IncomeBySourceSection data={incomeData} isLoading={isLoading} />
    </div>
  );
}
