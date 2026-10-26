'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { IconCash, IconDeviceDesktop, IconSchool, IconCreditCard } from '@tabler/icons-react';

interface IncomeBySourceSectionProps {
  data: any;
  isLoading: boolean;
}

export default function IncomeBySourceSection({ data, isLoading }: IncomeBySourceSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-8" role="status" aria-label="Loading income analytics">
        <Card className="gap-6 py-6 sm:py-8">
          <CardHeader className="gap-2 px-6 sm:px-8">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent className="space-y-3 px-6 sm:px-8">
            <Skeleton className="h-10 w-60 max-w-full" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Card key={i} className="gap-6 py-5">
                <CardHeader className="px-5">
                  <Skeleton className="h-10 w-full" />
                </CardHeader>
                <CardContent className="space-y-3 px-5">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-1.5 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Unable to load income analytics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const summary = data.summary || {};
  const bySource = data.bySource || {};

  const fallbackSourceTotals: Record<string, number> = {
    Online: Number(summary.onlineBookingIncome || 0),
    Cashier: Number(summary.cashierBookingIncome || 0),
    'Class Bookings': Number(summary.classBookingIncome || 0),
    Membership: Number(summary.membershipIncome || 0)
  };

  const sourceConfigs = [
    {
      key: 'Online',
      title: 'Online Booking',
      icon: IconDeviceDesktop,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      barColor: 'bg-blue-500'
    },
    {
      key: 'Cashier',
      title: 'Cashier Booking',
      icon: IconCash,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      barColor: 'bg-green-500'
    },
    {
      key: 'Class Bookings',
      title: 'Class Bookings',
      icon: IconSchool,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      barColor: 'bg-purple-500'
    },
    {
      key: 'Membership',
      title: 'Membership',
      icon: IconCreditCard,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      barColor: 'bg-orange-500'
    }
  ];

  const metrics = [
    { label: 'Gross amount', value: summary.totalGrossAmount || 0 },
    { label: 'Processing fees', value: summary.totalProcessingFees || 0 },
    { label: 'Net amount', value: summary.totalNetAmount || 0 }
  ];

  return (
    <div className="space-y-8">
      <Card className="gap-6 py-6 sm:py-8">
        <CardHeader className="gap-2 px-6 sm:px-8">
          <CardTitle className="text-base leading-snug">Total Income Summary</CardTitle>
          {data.dateRange?.startDate && data.dateRange?.endDate && (
            <CardDescription className="text-xs leading-relaxed sm:text-sm">
              {format(new Date(data.dateRange.startDate), 'dd MMM yyyy')} —{' '}
              {format(new Date(data.dateRange.endDate), 'dd MMM yyyy')}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="grid gap-6 px-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] xl:items-center xl:gap-8">
          <div className="min-w-0 space-y-3">
            <p className="text-muted-foreground text-sm font-medium">Total Income</p>
            <p className="text-3xl leading-tight font-semibold tracking-tight break-words tabular-nums sm:text-4xl">
              {formatCurrency(summary.totalIncome || 0)}
            </p>
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium tabular-nums">
                {summary.totalTransactions || 0}
              </span>{' '}
              {summary.totalTransactions === 1 ? 'transaction' : 'transactions'} in this period
            </p>
          </div>
          <dl className="grid gap-5 border-t pt-6 sm:grid-cols-3 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8">
            {metrics.map((metric) => (
              <div key={metric.label} className="min-w-0 space-y-2">
                <dt className="text-muted-foreground text-xs leading-relaxed font-medium sm:text-sm">
                  {metric.label}
                </dt>
                <dd className="text-base leading-snug font-semibold break-words tabular-nums xl:text-lg">
                  {formatCurrency(metric.value)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <section aria-labelledby="income-sources-title" className="space-y-4">
        <div className="space-y-1.5">
          <h3 id="income-sources-title" className="text-base font-semibold">
            Income sources
          </h3>
          <p className="text-muted-foreground text-sm">
            Contribution from each booking channel and membership.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sourceConfigs.map((config) => {
            const sourceData = bySource[config.key] || {
              count: 0,
              total: fallbackSourceTotals[config.key] || 0
            };
            const Icon = config.icon;
            const percentage = summary.totalIncome
              ? ((sourceData.total / summary.totalIncome) * 100).toFixed(1)
              : '0.0';

            return (
              <Card key={config.key} className="gap-6 py-5">
                <CardHeader className="flex flex-row items-center justify-between gap-3 px-5">
                  <CardTitle className="text-sm leading-snug font-medium">{config.title}</CardTitle>
                  <div className={cn('shrink-0 rounded-xl p-2.5', config.bgColor)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-5">
                  <div className="space-y-2">
                    <p className="text-2xl leading-tight font-semibold tracking-tight break-words tabular-nums">
                      {formatCurrency(sourceData.total)}
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {sourceData.count || 0}{' '}
                      {sourceData.count === 1 ? 'transaction' : 'transactions'}
                      <span className="mx-2" aria-hidden="true">
                        ·
                      </span>
                      {percentage}% of total
                    </p>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden="true">
                    <div
                      className={cn('h-full rounded-full', config.barColor)}
                      style={{ width: `${Math.min(100, Math.max(0, Number(percentage)))}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
