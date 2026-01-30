'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import type { BusinessInsightsResponse } from '@/types/model';
import {
  IconCash,
  IconCreditCard,
  IconReceipt,
  IconShoppingCart,
  IconTournament,
  IconUsers
} from '@tabler/icons-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface BusinessInsightsSectionProps {
  data: BusinessInsightsResponse | undefined;
  isLoading: boolean;
}

const chartConfig = {
  hours: {
    label: 'Bookings',
    color: 'hsl(var(--primary))'
  },
  days: {
    label: 'Bookings',
    color: 'hsl(var(--primary))'
  }
} satisfies ChartConfig;

export default function BusinessInsightsSection({ data, isLoading }: BusinessInsightsSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
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
          <CardDescription>Unable to load business insights</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { courts, coaches, inventory, memberships, bookings, revenue } = data;

  const insightCards = [
    {
      title: 'Court Utilization',
      icon: IconTournament,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      stats: [
        { label: 'Total Courts', value: courts.total || 0 },
        { label: 'Booked Courts', value: courts.booked || 0 },
        { label: 'Utilization Rate', value: courts.utilization || '0%' }
      ]
    },
    {
      title: 'Coach Performance',
      icon: IconUsers,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      stats: [
        { label: 'Total Coaches', value: coaches.total || 0 },
        { label: 'Active Coaches', value: coaches.active || 0 },
        { label: 'Total Sessions', value: coaches.totalSessions || 0 }
      ]
    },
    {
      title: 'Inventory Usage',
      icon: IconShoppingCart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      stats: [
        { label: 'Total Items', value: inventory.totalItems || 0 },
        { label: 'Items Used', value: inventory.itemsUsed || 0 },
        { label: 'Utilization', value: inventory.utilizationRate || '0%' }
      ]
    },
    {
      title: 'Membership Health',
      icon: IconCreditCard,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      stats: [
        { label: 'Total Members', value: memberships.total || 0 },
        { label: 'Active Members', value: memberships.active || 0 },
        { label: 'Active Rate', value: memberships.activePercentage || '0%' }
      ]
    },
    {
      title: 'Booking Statistics',
      icon: IconReceipt,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      stats: [
        { label: 'Total Bookings', value: bookings.total || 0 },
        { label: 'Confirmed', value: bookings.confirmed || 0 },
        {
          label: 'Confirmation Rate',
          value: bookings.confirmationRate || '0%'
        }
      ]
    },
    {
      title: 'Revenue Overview',
      icon: IconCash,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      stats: [
        { label: 'Total Revenue', value: formatCurrency(revenue.total || 0) },
        { label: 'Transactions', value: revenue.transactions || 0 },
        {
          label: 'Avg/Transaction',
          value: formatCurrency(Number(revenue.avgPerTransaction) || 0)
        }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      {/* Date Range */}
      {data.dateRange && (
        <Card>
          <CardHeader>
            <CardTitle>Business Insights</CardTitle>
            <CardDescription className="mt-2">
              Period: {new Date(data.dateRange.startDate).toLocaleDateString()} -{' '}
              {new Date(data.dateRange.endDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Insight Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insightCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={cn('rounded-full p-2', card.bgColor)}>
                  <Icon className={cn('h-4 w-4', card.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {card.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">{stat.label}</span>
                      <span className="text-sm font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Hours Chart */}
        {courts.topHours && courts.topHours.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours</CardTitle>
              <CardDescription>Busiest hours for court bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-50 w-full">
                <BarChart accessibilityLayer data={courts.topHours}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="count" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Days Chart */}
        {courts.topDays && courts.topDays.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Days</CardTitle>
              <CardDescription>Busiest days of the week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-50 w-full">
                <BarChart accessibilityLayer data={courts.topDays}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="count" fill="var(--color-days)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Performers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Courts (List) */}
        {courts.topCourts && courts.topCourts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Courts</CardTitle>
              <CardDescription>Most booked courts in this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courts.topCourts.map((court, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{court.court?.name}</div>
                      <div className="text-muted-foreground text-sm">{court.bookings} bookings</div>
                    </div>
                    <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Coaches (List) */}
        {coaches.topCoaches && coaches.topCoaches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Coaches</CardTitle>
              <CardDescription>Most active coaches in this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coaches.topCoaches.map((coach, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{coach.coach?.name}</div>
                      <div className="text-muted-foreground text-sm">{coach.sessions} sessions</div>
                    </div>
                    <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
