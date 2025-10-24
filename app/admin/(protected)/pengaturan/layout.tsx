'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { IconBell, IconLock, IconUser } from '@tabler/icons-react';
import AppSectionHeader from '@/components/ui/app-section-header';
import { dummyNotification } from '@/components/ui/app-notification-dropdown';
import { Badge } from '@/components/ui/badge';

type Props = {
  children: React.ReactNode;
};

const settingMenus = [
  {
    href: '/admin/pengaturan/akun-saya',
    icon: <IconUser className="size-4" />,
    label: 'Akun Saya'
  },
  {
    href: '/admin/pengaturan/notifikasi',
    icon: <IconBell className="size-4" />,
    label: 'Notifikasi'
  },
  {
    href: '/admin/pengaturan/kata-sandi',
    icon: <IconLock className="size-4" />,
    label: 'Kata Sandi'
  }
];

const SettingLayout = ({ children }: Props) => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div>
      <header className="px-4 pb-4 lg:px-6 lg:pt-4 lg:pb-0">
        <AppSectionHeader
          title="Pengaturan"
          description="Kelola preferensi dan informasi akun Anda."
          className="mb-0"
        />
      </header>
      <div className="flex flex-col lg:flex-row">
        <aside className="bg-background w-full lg:w-64">
          <nav className="p-4 px-0 pt-0 lg:p-6">
            <ul className="flex gap-2 overflow-x-auto lg:flex-col">
              {settingMenus.map(({ href, icon, label }) => (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    className={cn(
                      'hover:bg-muted hover:text-foreground text-muted-foreground flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors md:justify-between',
                      isActive(href) && 'bg-muted text-foreground font-semibold'
                    )}
                    prefetch
                  >
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="inline">{label}</span>
                    </div>
                    {label === 'Notifikasi' && dummyNotification.some((n) => !n.read) && (
                      <Badge
                        className="h-5 min-w-5 rounded-full px-1 font-mono font-semibold tabular-nums"
                        variant="secondary"
                      >
                        {dummyNotification.filter((n) => !n.read).length}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};
export default SettingLayout;
