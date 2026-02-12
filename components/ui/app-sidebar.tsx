'use client';

import { Command, LifeBuoy } from 'lucide-react';
import * as React from 'react';

import { NavMain } from '@/components/ui/nav-main';
import { NavSecondary } from '@/components/ui/nav-secondary';
import { NavUser } from '@/components/ui/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { SUPPORT_CIPTACODE_PHONE_NUMBER, ROLE } from '@/lib/constants';
import { getWhatsappMessageUrl } from '@/lib/utils';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import type { AppSidebarItem } from '@/types';
import {
  IconAd2,
  IconCategory,
  IconChartBar,
  IconDatabase,
  IconLaurelWreath1,
  IconScan,
  IconSchool,
  IconShoppingCart,
  IconUser,
  IconUsers,
  IconUsersGroup
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const data: { navMain: AppSidebarItem[]; navSecondary: AppSidebarItem[] } = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin/dashboard',
      icon: IconCategory,
      items: []
    },
    {
      title: 'Analytics',
      icon: IconChartBar,
      items: [
        {
          title: 'Income by Source',
          url: '/admin/analytics/income-by-source'
        },
        {
          title: 'Payment Methods',
          url: '/admin/analytics/payment-methods'
        },
        {
          title: 'Business Insights',
          url: '/admin/analytics/business-insights'
        }
      ]
    },

    {
      title: 'Booking System',
      icon: IconScan,
      items: [
        {
          title: 'Book Courts',
          url: '/admin/booking-lapangan'
        },
        {
          title: 'Add-ons & Equipment',
          url: '/admin/booking-add-ons'
        },
        {
          title: 'Book Membership',
          url: '/admin/booking-membership'
        },
        {
          title: 'Schedule',
          url: '/admin/schedule'
        }
      ]
    },
    {
      title: 'Kelola Pemesanan',
      icon: IconShoppingCart,
      items: [
        {
          title: 'Lapangan',
          url: '/admin/kelola-pemesanan/lapangan'
        },
        {
          title: 'Inventori',
          url: '/admin/kelola-pemesanan/inventori'
        },
        {
          title: 'Coach',
          url: '/admin/kelola-pemesanan/coach'
        },
        {
          title: 'Membership',
          url: '/admin/kelola-pemesanan/membership'
        }
      ]
    },
    // {
    //   title: 'Penjualan',
    //   icon: IconShoppingCart,
    //   items: [
    //     {
    //       title: 'Kelola Transaksi',
    //       url: '/admin/kelola-transaksi'
    //     }
    //   ]
    // },
    {
      title: 'Kustomer',
      icon: IconUsers,
      items: [
        {
          title: 'Kelola Kustomer',
          url: '/admin/kelola-kustomer'
        }
        // {
        //   title: 'Kustomer Membership',
        //   url: '/admin/kelola-kustomer/membership'
        // }
      ]
    },
    {
      title: 'Kelola Karyawan',
      url: '/admin/kelola-karyawan',
      icon: IconUser,
      items: []
    },
    // {
    //   title: 'Kelola Kelas',
    //   url: '/admin/kelola-kelas',
    //   icon: IconSchool,
    //   items: []
    // },
    {
      title: 'Kelola Turnamen',
      url: '/admin/kelola-turnamen',
      icon: IconLaurelWreath1,
      items: []
    },
    {
      title: 'Kelola Club',
      url: '/admin/kelola-club',
      icon: IconUsersGroup,
      items: []
    },
    {
      title: 'Marketing',
      icon: IconAd2,
      items: [
        {
          title: 'Push Notification',
          url: '/admin/kelola-notifikasi'
        },
        {
          title: 'Kelola Banner',
          url: '/admin/kelola-banner'
        },
        {
          title: 'Kelola Partnership',
          url: '/admin/kelola-partnership'
        }
      ]
    },
    {
      title: 'Master Data',
      icon: IconDatabase,
      items: [
        {
          title: 'Kelola Lapangan',
          url: '/admin/kelola-lapangan'
        },
        {
          title: 'Kelola Membership',
          url: '/admin/kelola-membership'
        },
        {
          title: 'Kelola Inventori',
          url: '/admin/kelola-inventori'
        },
        {
          title: 'Kelola Promo Code',
          url: '/admin/kelola-promo-code'
        },
        {
          title: 'Metode Pembayaran',
          url: '/admin/kelola-metode-pembayaran'
        }
      ]
    }
  ],
  navSecondary: [
    {
      title: 'Support Ciptacode',
      url: getWhatsappMessageUrl(
        SUPPORT_CIPTACODE_PHONE_NUMBER,
        'Halo Tim Ciptacode, saya butuh bantuan pada Dashboard Admin (Quantum Sport). Mohon bantuannya.'
      ),
      icon: LifeBuoy
    }
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const isDashboardActive = pathname === '/admin/dashboard' || pathname === '/admin/dashboard/';
  const { data: me, isLoading } = useQuery(adminProfileQueryOptions);
  const isCoach = me?.role?.toUpperCase?.() === ROLE.COACH;
  const isCashier = me?.role?.toUpperCase?.() === ROLE.CASHIER;
  const isAdminViewer = me?.role?.toUpperCase?.() === ROLE.ADMIN_VIEWER;
  const isAdmin = me?.role?.toUpperCase?.() === ROLE.ADMIN;

  const navMainItems = React.useMemo<AppSidebarItem[]>(() => {
    // If still loading user data, return empty array to avoid menu flash
    if (isLoading || !me) {
      return [];
    }

    if (isCoach) {
      return [
        {
          title: 'Jadwal Saya',
          url: '/admin/kelola-karyawan',
          icon: IconSchool,
          items: []
        }
      ];
    }

    if (isCashier) {
      return [
        {
          title: 'Booking System',
          icon: IconScan,
          items: [
            {
              title: 'Book Courts',
              url: '/admin/booking-lapangan'
            },
            {
              title: 'Add-ons & Equipment',
              url: '/admin/booking-add-ons'
            },
            {
              title: 'Book Membership',
              url: '/admin/booking-membership'
            },
            {
              title: 'Schedule',
              url: '/admin/schedule'
            }
          ]
        },
        {
          title: 'Kelola Pemesanan',
          icon: IconShoppingCart,
          items: [
            {
              title: 'Lapangan',
              url: '/admin/kelola-pemesanan/lapangan'
            },
            {
              title: 'Inventori',
              url: '/admin/kelola-pemesanan/inventori'
            },
            {
              title: 'Coach',
              url: '/admin/kelola-pemesanan/coach'
            }
          ]
        },
        {
          title: 'Kustomer',
          icon: IconUsers,
          items: [
            {
              title: 'Kelola Kustomer',
              url: '/admin/kelola-kustomer'
            }
          ]
        }
      ];
    }

    if (isAdminViewer) {
      // ADMIN_VIEWER can view everything except Dashboard, Master Data, Kelola Karyawan, and Marketing
      return data.navMain.filter(
        (item) =>
          item.title !== 'Dashboard' &&
          item.title !== 'Master Data' &&
          item.title !== 'Kelola Karyawan' &&
          item.title !== 'Marketing'
      );
    }

    return data.navMain;
  }, [isCoach, isCashier, isAdminViewer, isLoading, me]);

  // Get appropriate dashboard link based on role
  const dashboardLink = React.useMemo(() => {
    if (isLoading || !me) return '/admin/dashboard';
    if (isCoach) return '/admin/kelola-karyawan';
    if (isCashier) return '/admin/booking-lapangan';
    if (isAdminViewer) return '/admin/booking-lapangan';
    return '/admin/dashboard';
  }, [isCoach, isCashier, isAdminViewer, isLoading, me]);

  // Get appropriate subtitle based on role
  const subtitle = React.useMemo(() => {
    if (isLoading || !me) return 'Dashboard Admin';
    if (isAdmin) return 'Dashboard Admin';
    return 'Admin Panel';
  }, [isAdmin, isLoading, me]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild isActive={isDashboardActive}>
              <Link href={dashboardLink} prefetch>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Quantum Sport</span>
                  <span className="truncate text-xs">{subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
