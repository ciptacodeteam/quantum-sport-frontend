import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import type { StatItem } from '@/types/model';
import { IconMinus, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

interface StatsCardProps {
  title: string;
  stat: StatItem;
  subtitle: string;
}

export default function StatsCard({ title, stat, subtitle }: StatsCardProps) {
  const { value, formatted, percentageChange } = stat;
  const TrendIcon =
    percentageChange === 0 ? IconMinus : percentageChange > 0 ? IconTrendingUp : IconTrendingDown;
  const changeLabel =
    percentageChange === 0 ? 'Tidak ada perubahan' : percentageChange > 0 ? 'Meningkat' : 'Menurun';

  return (
    <Card className="min-w-0 gap-5 py-5 shadow-none">
      <CardHeader className="gap-3 px-5">
        <CardDescription className="font-medium">{title}</CardDescription>
        <CardTitle className="text-2xl leading-tight font-semibold tracking-tight break-words tabular-nums">
          {formatted || formatNumber(value)}
        </CardTitle>
      </CardHeader>
      <CardFooter className="mt-auto flex-col items-start gap-3 px-5">
        <p className="text-muted-foreground text-xs">{subtitle}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1 rounded-md font-medium"
            aria-label={`${changeLabel} ${Math.abs(percentageChange)}% dibanding bulan lalu`}
          >
            <TrendIcon className="size-3.5" />
            {percentageChange > 0 ? '+' : ''}
            {percentageChange}%
          </Badge>
          <span className="text-muted-foreground text-xs">dari bulan lalu</span>
        </div>
      </CardFooter>
    </Card>
  );
}
