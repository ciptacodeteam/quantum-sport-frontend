'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import AppSectionHeader from '@/components/ui/app-section-header';
import DateRangeInput from '@/components/ui/date-range-input';
import { paymentMethodsAnalyticsQueryOptions } from '@/queries/admin/analytics';
import PaymentMethodsSection from '@/components/admin/analytics/PaymentMethodsSection';
import type { DateRange } from 'react-day-picker';

export default function PaymentMethodsPage() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const startDate = range?.from ? format(range.from, "yyyy-MM-dd'T'00:00:00'Z'") : undefined;
  const endDate = range?.to ? format(range.to, "yyyy-MM-dd'T'23:59:59'Z'") : undefined;

  const { data: paymentData, isLoading } = useQuery(
    paymentMethodsAnalyticsQueryOptions(startDate, endDate)
  );

  return (
    <main className="space-y-6">
      <AppSectionHeader
        title="Payment Methods Analytics"
        description="Payment method usage and revenue distribution"
      >
        <DateRangeInput value={range} onValueChange={(r) => setRange(r ?? undefined)} />
      </AppSectionHeader>

      <PaymentMethodsSection data={paymentData} isLoading={isLoading} />
    </main>
  );
}
