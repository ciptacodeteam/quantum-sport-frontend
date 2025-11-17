import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import type { StatItem } from '@/types/model';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

interface StatsCardProps {
  title: string;
  stat: StatItem;
}

export default function StatsCard({ title, stat }: StatsCardProps) {
  const { value, formatted, percentageChange, trend, description, subtitle } = stat;
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? IconTrendingUp : IconTrendingDown;
  const sign = percentageChange >= 0 ? '+' : '';

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-2xl">
          {formatted || formatNumber(value)}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <TrendIcon />
            {sign}
            {percentageChange}%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-xs">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {description} <TrendIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">{subtitle}</div>
      </CardFooter>
    </Card>
  );
}
