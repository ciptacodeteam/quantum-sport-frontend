'use client';

import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, House, UserRound, Crown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { title: 'Beranda', icon: House, path: '/' },
  { title: 'Paket Saya', icon: Crown, path: '/my-packages', requiresAuth: true },
  { title: 'Riwayat', icon: CalendarCheck, path: '/invoice', requiresAuth: true },
  { title: 'Profil', icon: UserRound, path: '/profile', requiresAuth: true }
];

export default function MainBottomNavigation() {
  const pathname = usePathname();
  const { data: user } = useQuery(profileQueryOptions);
  const openAuthModal = useAuthModalStore((state) => state.open);

  return (
    <div className="h-[calc(7rem+env(safe-area-inset-bottom))] shrink-0 lg:hidden">
      <nav
        data-slot="mobile-bottom-navigation"
        aria-label="Navigasi utama mobile"
        className="fixed inset-x-0 bottom-0 z-40 h-[calc(6rem+env(safe-area-inset-bottom))] border-t border-black/15 bg-[#f8f8f6] pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid h-full max-w-lg grid-cols-4 px-2">
          {navigationItems.map((item) => {
            const active =
              pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`));
            const Icon = item.icon;
            const className = `relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#ad422b] ${active ? 'text-[#171717]' : 'text-black/45 hover:text-[#171717]'}`;
            const content = (
              <>
                <Icon
                  className={`size-7 ${active ? 'text-[#ad422b]' : ''}`}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span
                  className={`text-[11px] tracking-[0.01em] sm:text-sm ${active ? 'font-semibold' : 'font-medium'}`}
                >
                  {item.title}
                </span>
              </>
            );

            return (
              <li key={item.path} className="min-w-0">
                {item.requiresAuth && !user?.id ? (
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className={className}
                    aria-label={`Masuk untuk membuka ${item.title}`}
                  >
                    {content}
                  </button>
                ) : (
                  <Link
                    href={item.path}
                    className={className}
                    aria-current={active ? 'page' : undefined}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
