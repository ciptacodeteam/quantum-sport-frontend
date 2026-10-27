import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function CustomerSettingsCard({
  title,
  description,
  children,
  danger = false
}: {
  title: string;
  description: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={cn(
        'bg-background min-w-0 overflow-hidden rounded-xl border',
        danger && 'border-destructive/20'
      )}
    >
      <header className="space-y-1 border-b px-5 py-4">
        <h2 className={cn('text-sm font-semibold', danger && 'text-destructive')}>{title}</h2>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}
