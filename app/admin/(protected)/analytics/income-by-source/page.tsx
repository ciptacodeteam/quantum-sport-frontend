'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import AppSectionHeader from '@/components/ui/app-section-header';
import DateRangeInput from '@/components/ui/date-range-input';
import { incomeBySourceQueryOptions } from '@/queries/admin/analytics';
import IncomeBySourceSection from '@/components/admin/analytics/IncomeBySourceSection';

export default function IncomeBySourcePage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd'T'00:00:00'Z'") : undefined;
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd'T'23:59:59'Z'") : undefined;

  const { data: incomeData, isLoading } = useQuery(incomeBySourceQueryOptions(startDate, endDate));

  return (
    <main className="space-y-6">
      <AppSectionHeader
        title="Income by Source"
        description="Revenue breakdown by booking channels and membership"
      >
        <DateRangeInput value={date} onValueChange={(r) => setDate(r ?? undefined)} />
      </AppSectionHeader>

      <IncomeBySourceSection data={incomeData} isLoading={isLoading} />
    </main>
  );
}
