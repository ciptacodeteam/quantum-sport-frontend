'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import AppSectionHeader from '@/components/ui/app-section-header';
import DateRangeInput from '@/components/ui/date-range-input';
import { businessInsightsQueryOptions } from '@/queries/admin/analytics';
import BusinessInsightsSection from '@/components/admin/analytics/BusinessInsightsSection';
// import ExportButtons from '@/components/admin/analytics/ExportButtons';

export default function BusinessInsightsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd'T'00:00:00'Z'") : undefined;
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd'T'23:59:59'Z'") : undefined;

  const { data: businessData, isLoading } = useQuery(
    businessInsightsQueryOptions(startDate, endDate)
  );

  return (
    <main className="space-y-6">
      <AppSectionHeader
        title="Business Insights"
        description="Comprehensive metrics across your business operations"
      >
        <DateRangeInput value={date} onValueChange={(r) => setDate(r ?? undefined)} />
      </AppSectionHeader>

      <BusinessInsightsSection data={businessData} isLoading={isLoading} />

      {/* Export Buttons Section */}
      {/* <ExportButtons startDate={startDate} endDate={endDate} /> */}
    </main>
  );
}
