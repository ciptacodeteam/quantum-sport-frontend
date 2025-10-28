'use client';

import { IconBallTennis, IconCalendarCheck, IconHome, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import BottomNavigationWrapper from '../ui/BottomNavigationWrapper';

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
    <BottomNavigationWrapper>
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
    </BottomNavigationWrapper>
  );
};
export default MainBottomNavigation;
