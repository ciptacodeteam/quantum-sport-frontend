'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, subDays } from 'date-fns';
import { getAnalyticsDateRange } from '@/lib/analytics-date-range';
import AppSectionHeader from '@/components/ui/app-section-header';
import DateRangeInput from '@/components/ui/date-range-input';
import { paymentMethodsAnalyticsQueryOptions } from '@/queries/admin/analytics';
import PaymentMethodsSection from '@/components/admin/analytics/PaymentMethodsSection';
import type { DateRange } from 'react-day-picker';

export default function PaymentMethodsPage() {
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: subDays(startOfDay(new Date()), 29),
    to: startOfDay(new Date())
  }));

  const { startDate, endDate } = getAnalyticsDateRange(range);

  const { data: paymentData, isLoading } = useQuery(
    paymentMethodsAnalyticsQueryOptions(startDate, endDate)
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AppSectionHeader
        title="Payment Methods Analytics"
        description="Payment method usage and revenue distribution"
        className="mb-0 gap-4 pb-0 sm:items-center"
      >
        <DateRangeInput value={range} onValueChange={(r) => setRange(r ?? undefined)} />
      </AppSectionHeader>

      <PaymentMethodsSection data={paymentData} isLoading={isLoading} />
    </div>
  );
}
