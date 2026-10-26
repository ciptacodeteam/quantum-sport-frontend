'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, subDays } from 'date-fns';
import { getAnalyticsDateRange } from '@/lib/analytics-date-range';
import type { DateRange } from 'react-day-picker';

import AppSectionHeader from '@/components/ui/app-section-header';
import DateRangeInput from '@/components/ui/date-range-input';
import { businessInsightsQueryOptions } from '@/queries/admin/analytics';
import BusinessInsightsSection from '@/components/admin/analytics/BusinessInsightsSection';

export default function BusinessInsightsPage() {
  const [date, setDate] = useState<DateRange | undefined>(() => ({
    from: subDays(startOfDay(new Date()), 29),
    to: startOfDay(new Date())
  }));

  const { startDate, endDate } = getAnalyticsDateRange(date);

  const { data: businessData, isLoading } = useQuery(
    businessInsightsQueryOptions(startDate, endDate)
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AppSectionHeader
        title="Business Insights"
        description="Comprehensive metrics across your business operations"
        className="mb-0 gap-4 pb-0 sm:items-center"
      >
        <DateRangeInput value={date} onValueChange={(r) => setDate(r ?? undefined)} />
      </AppSectionHeader>

      <BusinessInsightsSection data={businessData} isLoading={isLoading} />
    </div>
  );
}
