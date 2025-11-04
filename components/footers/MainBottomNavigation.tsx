'use client';

import { IconBallTennis, IconCalculatorFilled, IconCalendarCheck, IconCalendarFilled, IconHome, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import BottomNavigationWrapper from '../ui/BottomNavigationWrapper';
import { CalendarCheck, CalendarCheckIcon, HomeIcon } from 'lucide-react';

const navigationItems = [
  { title: 'Beranda', icon: <HomeIcon size={28} />, path: '/' },
  { title: 'Pemesanan', icon: <IconBallTennis size={28} />, path: '/activities' },
  { title: 'History', icon: <CalendarCheckIcon size={28} />, path: '/sports' },
  { title: 'Profil', icon: <IconUser size={28} />, path: '/profile' }
];

const MainBottomNavigation = () => {
  const pathname = usePathname();

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  return (
    <BottomNavigationWrapper>
      <ul className="w-11/12 flex-between mx-auto">
        {navigationItems.map((item) => (
          <li key={item.title}>
            <Link
              href={item.path}
              className={`flex-center flex-col py-2 ${
                isActive(item.path) ? 'text-primary' : 'text-gray-400'
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
