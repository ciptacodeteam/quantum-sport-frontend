'use client';

import { IconBallTennis, IconCalendarCheck, IconHome, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

const navigationItems = [
  { title: 'Home', icon: <IconHome size={28} />, path: '/' },
  { title: 'Activities', icon: <IconCalendarCheck size={28} />, path: '/activities' },
  { title: 'Sports', icon: <IconBallTennis size={28} />, path: '/sports' },
  { title: 'Profile', icon: <IconUser size={28} />, path: '/profile' }
];

const MainBottomNavigation = () => {
  const pathname = usePathname();

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  return (
    <div className="fixed right-0 bottom-0 left-0">
      <div className="flex-center min-h-24 w-full border-t-2 bg-white pb-3 md:hidden">
        <nav className="w-full max-w-7xl px-4">
          <ul className="flex-between w-full">
            {navigationItems.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.path}
                  className={`flex-center flex-col py-2 ${
                    isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.icon}
                  <span className="mt-1 text-xs sm:text-sm">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};
export default MainBottomNavigation;
