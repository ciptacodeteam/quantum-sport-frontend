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
  IconBallTennis,
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
    color: 'var(--chart-3)'
  },
  days: {
    label: 'Bookings',
    color: 'var(--chart-2)'
  },
  courtHours: {
    label: 'Hours',
    color: 'var(--chart-3)'
  }
} satisfies ChartConfig;

const formatHours = (hours: number) =>
  new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1
  }).format(hours);

export default function BusinessInsightsSection({ data, isLoading }: BusinessInsightsSectionProps) {
  if (isLoading) {
    return (
      <div
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        role="status"
        aria-label="Loading business insights"
      >
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="gap-5 py-5">
            <CardHeader className="px-5">
              <Skeleton className="h-10 w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-5 px-5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex flex-col gap-3 border-t pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="gap-2 px-6 py-2">
          <CardTitle className="text-base leading-snug">Business insights unavailable</CardTitle>
          <CardDescription className="text-xs leading-relaxed sm:text-sm">
            Unable to load business insights
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { courts, coaches, inventory, memberships, bookings, revenue } = data;
  const courtRows = [...(courts.courtHours ?? [])].sort(
    (a, b) =>
      b.bookingCount - a.bookingCount ||
      b.bookedHours - a.bookedHours ||
      a.court.name.localeCompare(b.court.name)
  );

  const insightCards = [
    {
      title: 'Court Utilization',
      value: courts.utilization || '0%',
      label: 'Court utilization',
      icon: IconBallTennis,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      stats: [
        { label: 'Total Courts', value: courts.total || 0 },
        { label: 'Booked Courts', value: courts.booked || 0 },
        {
          label: 'Total Booked Hours',
          value: `${formatHours(courts.totalBookedHours || 0)} jam`
        }
      ]
    },
    {
      title: 'Coach Performance',
      value: coaches.totalSessions || 0,
      label: 'Coaching sessions',
      icon: IconUsers,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      stats: [
        { label: 'Total Coaches', value: coaches.total || 0 },
        { label: 'Active Coaches', value: coaches.active || 0 }
      ]
    },
    {
      title: 'Inventory Usage',
      value: inventory.utilizationRate || '0%',
      label: 'Inventory utilization',
      icon: IconShoppingCart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      stats: [
        { label: 'Total Items', value: inventory.totalItems || 0 },
        { label: 'Items Used', value: inventory.itemsUsed || 0 }
      ]
    },
    {
      title: 'Membership Health',
      value: memberships.active || 0,
      label: 'Active members',
      icon: IconCreditCard,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      stats: [
        { label: 'Total Members', value: memberships.total || 0 },
        { label: 'Active Rate', value: memberships.activePercentage || '0%' }
      ]
    },
    {
      title: 'Booking Statistics',
      value: bookings.total || 0,
      label: 'Total bookings',
      icon: IconReceipt,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      stats: [
        { label: 'Confirmed', value: bookings.confirmed || 0 },
        {
          label: 'Confirmation Rate',
          value: bookings.confirmationRate || '0%'
        }
      ]
    },
    {
      title: 'Revenue Overview',
      value: formatCurrency(revenue.total || 0),
      label: 'Total revenue',
      icon: IconCash,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      stats: [
        { label: 'Transactions', value: revenue.transactions || 0 },
        {
          label: 'Avg/Transaction',
          value: formatCurrency(Number(revenue.avgPerTransaction) || 0)
        }
      ]
    }
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Insight Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {insightCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="min-w-0 gap-5 py-5 sm:py-6"
              role="region"
              aria-label={card.title}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 sm:px-6">
                <CardTitle className="text-sm leading-snug font-medium">{card.title}</CardTitle>
                <div className={cn('shrink-0 rounded-xl p-2.5', card.bgColor)}>
                  <Icon className={cn('h-4 w-4', card.color)} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5 px-5 sm:px-6">
                <div className="flex flex-col gap-2">
                  <p className="text-2xl leading-tight font-semibold tracking-tight break-words tabular-nums">
                    {card.value}
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{card.label}</p>
                </div>
                <dl className="mt-auto flex flex-col gap-3 border-t pt-4">
                  {card.stats.map((stat) => (
                    <div key={stat.label} className="flex items-baseline justify-between gap-4">
                      <dt className="text-muted-foreground text-xs leading-relaxed">
                        {stat.label}
                      </dt>
                      <dd className="text-right text-sm font-medium break-words tabular-nums">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      {(courts.topHours?.length > 0 || courts.topDays?.length > 0) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Top Hours Chart */}
          {courts.topHours && courts.topHours.length > 0 && (
            <Card className="min-w-0 gap-6 py-6">
              <CardHeader className="gap-2 px-5 sm:px-6">
                <CardTitle className="text-base leading-snug">Peak Hours</CardTitle>
                <CardDescription className="text-xs leading-relaxed sm:text-sm">
                  Busiest hours for court bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 sm:px-6">
                <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full">
                  <BarChart
                    accessibilityLayer
                    data={courts.topHours}
                    barSize={32}
                    margin={{ left: -20, right: 8, top: 8 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="hour" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      allowDecimals={false}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-hours)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Days Chart */}
          {courts.topDays && courts.topDays.length > 0 && (
            <Card className="min-w-0 gap-6 py-6">
              <CardHeader className="gap-2 px-5 sm:px-6">
                <CardTitle className="text-base leading-snug">Popular Days</CardTitle>
                <CardDescription className="text-xs leading-relaxed sm:text-sm">
                  Busiest days of the week
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 sm:px-6">
                <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full">
                  <BarChart
                    accessibilityLayer
                    data={courts.topDays}
                    barSize={40}
                    margin={{ left: -20, right: 8, top: 8 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      allowDecimals={false}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-days)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {courtRows.length > 0 && (
        <Card className="min-w-0 gap-6 py-6">
          <CardHeader className="gap-2 px-5 sm:px-6">
            <CardTitle className="text-base leading-snug">Court Performance</CardTitle>
            <CardDescription className="text-xs leading-relaxed sm:text-sm">
              Booked sessions and hours by session date, ranked by number of sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 px-5 sm:px-6">
            <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
              <BarChart
                accessibilityLayer
                data={courtRows.map((item) => ({
                  name: item.court.name,
                  hours: item.bookedHours
                }))}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar
                  dataKey="hours"
                  fill="var(--color-courtHours)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>

            <div className="overflow-x-auto rounded-md border">
              <table aria-label="Court performance" className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th scope="col" className="w-16 px-4 py-3 text-center font-medium">
                      Rank
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">
                      Court
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">
                      Sport
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Booked Sessions
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Hours Booked
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courtRows.map((item, index) => (
                    <tr key={item.court.id} className="border-b last:border-b-0">
                      <td className="text-muted-foreground px-4 py-3 text-center tabular-nums">
                        {item.bookingCount > 0 ? index + 1 : '—'}
                      </td>
                      <th scope="row" className="px-4 py-3 text-left font-medium">
                        {item.court.name}
                      </th>
                      <td className="text-muted-foreground px-4 py-3 capitalize">
                        {item.court.sport.toLowerCase()}
                      </td>
                      <td className="px-4 py-3 text-right">{item.bookingCount}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatHours(item.bookedHours)} jam
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {coaches.topCoaches?.length > 0 && (
        <div>
          {/* Top Coaches (List) */}
          {coaches.topCoaches && coaches.topCoaches.length > 0 && (
            <Card className="min-w-0 gap-6 py-6">
              <CardHeader className="gap-2 px-5 sm:px-6">
                <CardTitle className="text-base leading-snug">Top Coaches</CardTitle>
                <CardDescription className="text-xs leading-relaxed sm:text-sm">
                  Most active coaches in this period
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 sm:px-6">
                <div className="divide-y">
                  {coaches.topCoaches.map((coach, idx) => (
                    <div
                      key={coach.coach.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <div className="text-sm font-medium">{coach.coach?.name}</div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          {coach.sessions} sessions
                        </div>
                      </div>
                      <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
