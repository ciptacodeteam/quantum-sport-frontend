'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import { IconCreditCard, IconReceiptTax, IconTrendingUp, IconUsers } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';

interface PaymentMethodAnalytics {
  method: { id: string | null; name: string; logo?: string | null };
  count: number;
  total: number;
  processingFee: number;
  percentage: number;
}

interface PaymentMethodsSectionProps {
  data:
    | {
        summary?: {
          totalAmount?: number;
          totalProcessingFees?: number;
          totalTransactions?: number;
          methodCount?: number;
        };
        methods?: PaymentMethodAnalytics[];
        dateRange?: { startDate: string; endDate: string };
      }
    | null
    | undefined;
  isLoading: boolean;
}

export default function PaymentMethodsSection({ data, isLoading }: PaymentMethodsSectionProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8" role="status" aria-label="Loading payment analytics">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="gap-6 py-6">
              <CardHeader className="px-6">
                <Skeleton className="h-8 w-full" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3 px-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-40 max-w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="gap-6 py-6 sm:py-8">
          <CardHeader className="gap-3 px-6 sm:px-8">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </CardHeader>
          <CardContent className="px-6 sm:px-8">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="py-6">
        <CardHeader className="gap-3 px-6">
          <CardTitle className="text-base leading-snug">Payment analytics unavailable</CardTitle>
          <CardDescription>
            Unable to load payment methods. Please refresh and try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const summary = data.summary ?? {};
  const totalAmount = summary.totalAmount ?? 0;
  const totalFees = summary.totalProcessingFees ?? 0;
  const totalTransactions = summary.totalTransactions ?? 0;
  const netRevenue = totalAmount - totalFees;
  const feePercentage = totalAmount > 0 ? (totalFees / totalAmount) * 100 : 0;
  const sortedMethods = [...(data.methods ?? [])].sort((a, b) => b.total - a.total);
  const methodCount = summary.methodCount ?? sortedMethods.length;
  const stats = [
    {
      label: 'Gross Revenue',
      value: formatCurrency(totalAmount),
      hint: 'Before processing fees',
      icon: IconTrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Processing Fees',
      value: formatCurrency(totalFees),
      hint: `${feePercentage.toFixed(2)}% of gross revenue`,
      icon: IconReceiptTax,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Net Revenue',
      value: formatCurrency(netRevenue),
      hint: 'After processing fees',
      icon: IconTrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Transactions',
      value: totalTransactions.toLocaleString('en-US'),
      hint: `Across ${methodCount} payment method${methodCount === 1 ? '' : 's'}`,
      icon: IconUsers,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10'
    }
  ];

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <section aria-label="Payment overview" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="min-w-0 gap-6 py-6">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-6">
              <CardTitle className="text-muted-foreground text-sm leading-snug font-medium">
                {stat.label}
              </CardTitle>
              <div className={cn('shrink-0 rounded-xl p-2.5', stat.bg)}>
                <stat.icon className={cn('size-4', stat.color)} aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-6">
              <p
                className={cn(
                  'text-2xl leading-tight font-semibold tracking-tight break-words tabular-nums',
                  stat.label === 'Net Revenue' && 'text-emerald-600'
                )}
              >
                {stat.value}
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="gap-6 py-6 sm:py-8">
        <CardHeader className="flex flex-col gap-4 px-6 sm:flex-row sm:items-start sm:justify-between sm:px-8">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-base leading-snug">Payment Methods</CardTitle>
            <CardDescription className="text-xs leading-relaxed sm:text-sm">
              {data.dateRange?.startDate && data.dateRange?.endDate
                ? `${format(new Date(data.dateRange.startDate), 'dd MMM yyyy')} — ${format(new Date(data.dateRange.endDate), 'dd MMM yyyy')}`
                : 'Revenue and fees by payment method'}
            </CardDescription>
          </div>
          {sortedMethods.length > 0 && (
            <Badge variant="secondary" className="self-start px-3 py-1">
              {methodCount} payment method{methodCount === 1 ? '' : 's'}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="px-6 sm:px-8">
          {sortedMethods.length === 0 ? (
            <div className="bg-muted/30 flex min-h-56 flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center">
              <div className="bg-background rounded-2xl border p-3">
                <IconCreditCard className="text-muted-foreground size-6" aria-hidden="true" />
              </div>
              <div className="flex max-w-sm flex-col gap-2">
                <p className="text-sm font-semibold">No payments in this period</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Try a different date range to see payment methods, revenue, and processing fees.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {sortedMethods.map((method) => {
                const percentage = Math.min(100, Math.max(0, method.percentage || 0));
                const metrics = [
                  { label: 'Gross amount', value: method.total },
                  { label: 'Processing fees', value: method.processingFee },
                  { label: 'Net amount', value: method.total - method.processingFee },
                  {
                    label: 'Avg. transaction',
                    value: method.count > 0 ? method.total / method.count : 0
                  }
                ];
                return (
                  <article
                    key={method.method.id ?? 'unknown'}
                    aria-label={method.method.name}
                    className="flex min-w-0 flex-col gap-6 rounded-xl border p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-xl">
                          {method.method.logo ? (
                            <Image
                              src={method.method.logo}
                              alt=""
                              unoptimized
                              width={24}
                              height={24}
                              className="size-6 object-contain"
                            />
                          ) : (
                            <IconCreditCard
                              className="text-muted-foreground size-5"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <h4 className="text-sm leading-snug font-semibold break-words">
                            {method.method.name}
                          </h4>
                          <p className="text-muted-foreground text-xs">
                            {method.count} transaction{method.count === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 tabular-nums">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress
                      value={percentage}
                      aria-label={`${method.method.name} share of gross revenue`}
                      className="h-1.5"
                    />
                    <dl className="grid grid-cols-2 gap-x-5 gap-y-6 border-t pt-5">
                      {metrics.map((metric) => (
                        <div key={metric.label} className="flex min-w-0 flex-col gap-2">
                          <dt className="text-muted-foreground text-xs leading-relaxed">
                            {metric.label}
                          </dt>
                          <dd
                            className={cn(
                              'text-sm font-semibold break-words tabular-nums sm:text-base',
                              metric.label === 'Net amount' && 'text-emerald-600'
                            )}
                          >
                            {formatCurrency(metric.value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {sortedMethods.length > 1 && (
        <Card className="gap-6 py-6 sm:py-8">
          <CardHeader className="gap-2 px-6 sm:px-8">
            <CardTitle className="text-base leading-snug">Revenue Comparison</CardTitle>
            <CardDescription className="text-xs leading-relaxed sm:text-sm">
              Gross revenue distribution by payment method
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 px-6 sm:px-8">
            {sortedMethods.map((method) => (
              <div key={method.method.id ?? 'unknown'} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 text-sm">
                  <span className="font-medium">{method.method.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatCurrency(method.total)}
                  </span>
                </div>
                <Progress
                  value={
                    totalAmount > 0
                      ? Math.min(100, Math.max(0, (method.total / totalAmount) * 100))
                      : 0
                  }
                  aria-label={`${method.method.name} revenue share`}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
