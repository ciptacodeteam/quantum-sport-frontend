import type { ReactNode } from 'react';

export default function StaffSettingsCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-background min-w-0 overflow-hidden rounded-xl border">
      <header className="space-y-1 border-b px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}
