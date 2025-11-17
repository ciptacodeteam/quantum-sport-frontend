'use client';

import * as React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { dailyTransactionsQueryOptions } from '@/queries/admin/analytics';
import type { TransactionPeriod } from '@/types/model';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { formatNumber } from '@/lib/utils';

const chartConfig = {
  total: {
    label: 'Transactions',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

const PERIOD_OPTIONS = {
  '7days': { label: 'Last 7 days', value: '7days' as TransactionPeriod },
  '30days': { label: 'Last 30 days', value: '30days' as TransactionPeriod },
  '3months': { label: 'Last 3 months', value: '3months' as TransactionPeriod }
};

export default function TransactionChart() {
  const isMobile = useIsMobile();
  const [period, setPeriod] = React.useState<TransactionPeriod>('30days');

  const { data, isLoading, isError } = useQuery(dailyTransactionsQueryOptions(period));

  React.useEffect(() => {
    if (isMobile) {
      setPeriod('7days');
    }
  }, [isMobile]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value as TransactionPeriod);
  };

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Daily Transactions</CardTitle>
          <CardDescription>Transaction trends over time</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="aspect-auto h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Daily Transactions</CardTitle>
          <CardDescription>Transaction trends over time</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="text-muted-foreground flex h-[250px] items-center justify-center">
            Failed to load transaction data. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { chartData, summary } = data;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="mb-2">Daily Transactions</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {formatNumber(summary.totalTransactions)} transactions |{' '}
            {formatNumber(summary.totalRevenue)} revenue
          </span>
          <span className="@[540px]/card:hidden">
            {formatNumber(summary.totalTransactions)} transactions
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={handlePeriodChange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value={PERIOD_OPTIONS['3months'].value}>
              {PERIOD_OPTIONS['3months'].label}
            </ToggleGroupItem>
            <ToggleGroupItem value={PERIOD_OPTIONS['30days'].value}>
              {PERIOD_OPTIONS['30days'].label}
            </ToggleGroupItem>
            <ToggleGroupItem value={PERIOD_OPTIONS['7days'].value}>
              {PERIOD_OPTIONS['7days'].label}
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a period"
            >
              <SelectValue placeholder={PERIOD_OPTIONS['30days'].label} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {Object.values(PERIOD_OPTIONS).map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-lg">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} tickCount={6} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => dayjs(value as string).format('MMM D')}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => dayjs(value as string).format('MMM D, YYYY')}
                  indicator="dot"
                />
              }
            />
            <Line
              dataKey="total"
              type="bump"
              fill="url(#fillTotal)"
              stroke="var(--color-total)"
              strokeWidth={2}
              fillOpacity={1}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
