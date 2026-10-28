'use client';

import TransactionChart from '@/components/admin/charts/TransactionChart';
import StatsCard from '@/components/admin/dashboard/StatsCard';
import OnGoingBookingScheduleSection from '@/components/admin/sections/OnGoingBookingScheduleSection';
import AppSectionHeader from '@/components/ui/app-section-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLE } from '@/lib/constants';
import { dashboardStatsQueryOptions } from '@/queries/admin/analytics';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: me } = useQuery(adminProfileQueryOptions);
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery(dashboardStatsQueryOptions());

  // Role-based access control - only ADMIN (super admin) can view dashboard
  useEffect(() => {
    if (!me) return;

    const userRole = me.role?.toUpperCase?.();

    // Redirect based on role
    if (userRole === ROLE.COACH) {
      router.replace('/admin/kelola-karyawan');
    } else if (userRole === ROLE.CASHIER) {
      router.replace('/admin/booking-lapangan');
    } else if (userRole === ROLE.ADMIN_VIEWER) {
      router.replace('/admin/booking-lapangan');
    } else if (userRole === ROLE.BALLBOY) {
      router.replace('/admin/kelola-karyawan');
    } else if (userRole !== ROLE.ADMIN && userRole !== ROLE.SUPER_ADMIN) {
      // Any other role that's not ADMIN should be redirected
      router.replace('/admin/booking-lapangan');
    }
  }, [me, router]);

  // Only ADMIN role can view dashboard - show loading for others during redirect
  if (!me || ![ROLE.ADMIN, ROLE.SUPER_ADMIN].some((role) => role === me.role?.toUpperCase?.())) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  return (
    <main className="w-full min-w-0 space-y-6 pb-6">
      <div>
        <AppSectionHeader
          title="Dashboard Black Padel"
          description="Pantau kinerja lapangan dan kelola operasional bisnis Anda dengan mudah."
        />
      </div>

      <section
        aria-label="Ringkasan bulan ini"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {isLoading ? (
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
        ) : isError ? (
          <Card className="col-span-full items-center gap-3 p-6 text-center" role="alert">
            <p className="text-muted-foreground text-sm">Ringkasan dashboard belum dapat dimuat.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              Coba lagi
            </Button>
          </Card>
        ) : stats ? (
          <>
            <StatsCard
              title="Pendapatan"
              stat={stats.totalRevenue}
              subtitle="Total pembayaran yang diterima bulan ini"
            />
            <StatsCard
              title="Transaksi"
              stat={stats.totalSales}
              subtitle="Transaksi lunas bulan ini"
            />
            <StatsCard
              title="Pelanggan baru"
              stat={stats.newCustomers}
              subtitle="Pelanggan yang bergabung bulan ini"
            />
            <StatsCard
              title="Akun aktif"
              stat={stats.activeAccounts}
              subtitle="Pelanggan yang bertransaksi bulan ini"
            />
          </>
        ) : null}
      </section>

      <section aria-label="Grafik transaksi">
        <TransactionChart />
      </section>
      <OnGoingBookingScheduleSection />
    </main>
  );
}
