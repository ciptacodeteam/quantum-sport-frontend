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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dailyTransactionsQueryOptions } from '@/queries/admin/analytics';
import type { TransactionPeriod } from '@/types/model';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { formatNumber } from '@/lib/utils';

const chartConfig = {
  total: {
    label: 'Transaksi',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

const PERIOD_OPTIONS = {
  '7days': { label: '7 hari terakhir', value: '7days' as TransactionPeriod },
  '30days': { label: '30 hari terakhir', value: '30days' as TransactionPeriod },
  '3months': { label: '3 bulan terakhir', value: '3months' as TransactionPeriod }
};

export default function TransactionChart() {
  const [period, setPeriod] = React.useState<TransactionPeriod>('30days');

  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    dailyTransactionsQueryOptions(period)
  );

  const handlePeriodChange = (value: string) => {
    if (value in PERIOD_OPTIONS) setPeriod(value as TransactionPeriod);
  };

  if (isLoading) {
    return (
      <Card className="@container/card gap-5 shadow-none">
        <CardHeader>
          <CardTitle>Transaksi harian</CardTitle>
          <CardDescription>Pantau jumlah transaksi lunas per hari</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="aspect-auto h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="@container/card gap-5 shadow-none">
        <CardHeader>
          <CardTitle>Transaksi harian</CardTitle>
          <CardDescription>Pantau jumlah transaksi lunas per hari</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div
            role="alert"
            className="text-muted-foreground flex h-[250px] flex-col items-center justify-center gap-3 text-sm"
          >
            Data transaksi belum dapat dimuat.
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              Coba lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { chartData, summary } = data;

  return (
    <Card className="@container/card gap-5 shadow-none">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle>Transaksi harian</CardTitle>
          <CardDescription>
            {formatNumber(summary.totalTransactions)} transaksi · Rp{' '}
            {formatNumber(summary.totalRevenue)}
          </CardDescription>
        </div>
        <CardAction className="w-full self-auto sm:w-auto">
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={handlePeriodChange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-3! @[700px]/card:flex"
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
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[700px]/card:hidden"
              size="sm"
              aria-label="Pilih periode transaksi"
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
        {summary.totalTransactions === 0 && (
          <p className="text-muted-foreground mb-3 px-2 text-sm">
            Belum ada transaksi lunas pada periode ini.
          </p>
        )}
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              allowDecimals={false}
              domain={[0, (max: number) => Math.max(1, max)]}
            />
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
              type="linear"
              stroke="var(--color-total)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
