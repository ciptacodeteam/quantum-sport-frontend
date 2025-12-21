'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { IconCash, IconDeviceDesktop, IconSchool, IconCreditCard } from '@tabler/icons-react';

interface IncomeBySourceSectionProps {
  data: any;
  isLoading: boolean;
}

export default function IncomeBySourceSection({ data, isLoading }: IncomeBySourceSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
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
      bgColor: 'bg-blue-500/10'
    },
    {
      key: 'Cashier',
      title: 'Cashier Booking',
      icon: IconCash,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      key: 'Class Bookings',
      title: 'Class Bookings',
      icon: IconSchool,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      key: 'Membership',
      title: 'Membership',
      icon: IconCreditCard,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Total Income Summary</CardTitle>
          <CardDescription>
            {data.dateRange?.startDate && data.dateRange?.endDate && (
              <>
                {new Date(data.dateRange.startDate).toLocaleDateString()} -{' '}
                {new Date(data.dateRange.endDate).toLocaleDateString()}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Income</span>
              <span className="text-2xl font-bold">{formatCurrency(summary.totalIncome || 0)}</span>
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>Total Transactions</span>
              <span className="font-medium">{summary.totalTransactions || 0}</span>
            </div>

            <div className="my-2 border-t" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Total Gross Amount</span>
                <span className="font-medium">{formatCurrency(summary.totalGrossAmount || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Processing Fees</span>
                <span className="font-medium">
                  {formatCurrency(summary.totalProcessingFees || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Net Amount</span>
                <span className="font-medium">{formatCurrency(summary.totalNetAmount || 0)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income by Source Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <Card key={config.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
                <div className={cn('rounded-full p-2', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(sourceData.total)}</div>
                <p className="text-muted-foreground text-xs">
                  {sourceData.count ? `${sourceData.count} transactions • ` : ''}
                  {percentage}% of total
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
