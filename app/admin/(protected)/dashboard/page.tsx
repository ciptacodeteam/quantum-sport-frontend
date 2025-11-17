'use client';

import TransactionChart from '@/components/admin/charts/TransactionChart';
import StatsCard from '@/components/admin/dashboard/StatsCard';
import OnGoingBookingScheduleSection from '@/components/admin/sections/OnGoingBookingScheduleSection';
import AppSectionHeader from '@/components/ui/app-section-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardStatsQueryOptions } from '@/queries/admin/analytics';
import { useQuery } from '@tanstack/react-query';

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useQuery(dashboardStatsQueryOptions());

  return (
    <main>
      <header>
        <AppSectionHeader
          title="Selamat datang di Quantum Sport Dashboard"
          description="Pantau kinerja lapangan dan kelola operasional bisnis Anda dengan mudah."
        />
      </header>

      <section className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading || isError ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="@container/card">
                <CardHeader className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-6 w-16" />
                </CardHeader>
                <div className="space-y-2 p-6 pt-0">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </Card>
            ))}
          </>
        ) : stats ? (
          <>
            <StatsCard title="Total Revenue" stat={stats.totalRevenue} />
            <StatsCard title="Total Sales" stat={stats.totalSales} />
            <StatsCard title="New Customers" stat={stats.newCustomers} />
            <StatsCard title="Active Accounts" stat={stats.activeAccounts} />
          </>
        ) : null}
      </section>

      <section className="mt-6">
        <TransactionChart />
      </section>
      <OnGoingBookingScheduleSection />
    </main>
  );
}
