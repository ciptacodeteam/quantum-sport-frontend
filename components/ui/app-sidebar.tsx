'use client';

import { LifeBuoy } from 'lucide-react';
import * as React from 'react';

import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
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
  IconScan,
  IconShoppingCart,
  IconUser,
  IconUsers
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';

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
          title: 'Court Performance',
          url: '/admin/analytics/court-performance'
        },
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
          title: 'Book Padel Courts',
          url: '/admin/booking-lapangan?courtSport=PADEL'
        },
        {
          title: 'Book Tennis Courts',
          url: '/admin/booking-lapangan?courtSport=TENNIS'
        },
        {
          title: 'Add-ons & Equipment',
          url: '/admin/booking-add-ons'
        },
        {
          title: 'Book Value Pack',
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
          title: 'Lapangan Padel',
          url: '/admin/kelola-pemesanan/lapangan?courtSport=PADEL'
        },
        {
          title: 'Lapangan Tennis',
          url: '/admin/kelola-pemesanan/lapangan?courtSport=TENNIS'
        },
        {
          title: 'Inventori',
          url: '/admin/kelola-pemesanan/inventori'
        },
        {
          title: 'Value Pack',
          url: '/admin/kelola-pemesanan/membership'
        },
        { title: 'Tunggakan Value Pack', url: '/admin/kelola-pemesanan/tunggakan-value-pack' }
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
      title: 'Marketing',
      icon: IconAd2,
      items: [
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
          title: 'Pengaturan Jam Tarif',
          url: '/admin/pengaturan-jam-tarif'
        },
        {
          title: 'Kelola Value Pack',
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
  const { branchId: activeBranchId } = useAdminCourtSports();
  const { data: me, isLoading } = useQuery(adminProfileQueryOptions);
  const isCashier = me?.role?.toUpperCase?.() === ROLE.CASHIER;
  const isAdminViewer = me?.role?.toUpperCase?.() === ROLE.ADMIN_VIEWER;
  const isAdmin = [ROLE.ADMIN, ROLE.SUPER_ADMIN].includes(
    me?.role?.toUpperCase?.() as typeof ROLE.ADMIN | typeof ROLE.SUPER_ADMIN
  );

  const navMainItems = React.useMemo<AppSidebarItem[]>(() => {
    // If still loading user data, return empty array to avoid menu flash
    if (isLoading || !me) {
      return [];
    }

    if (isCashier) {
      return [
        {
          title: 'Booking System',
          icon: IconScan,
          items: [
            {
              title: 'Book Padel Courts',
              url: '/admin/booking-lapangan?courtSport=PADEL'
            },
            {
              title: 'Book Tennis Courts',
              url: '/admin/booking-lapangan?courtSport=TENNIS'
            },
            {
              title: 'Add-ons & Equipment',
              url: '/admin/booking-add-ons'
            },
            {
              title: 'Book Value Pack',
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
              title: 'Lapangan Padel',
              url: '/admin/kelola-pemesanan/lapangan?courtSport=PADEL'
            },
            {
              title: 'Lapangan Tennis',
              url: '/admin/kelola-pemesanan/lapangan?courtSport=TENNIS'
            },
            {
              title: 'Inventori',
              url: '/admin/kelola-pemesanan/inventori'
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

    if (me.role !== ROLE.SUPER_ADMIN)
      return data.navMain.map((item) => ({
        ...item,
        items: item.items?.filter(
          (child) =>
            !['/admin/kelola-membership', '/admin/kelola-metode-pembayaran'].includes(
              child.url || ''
            )
        )
      }));
    return data.navMain;
  }, [isCashier, isAdminViewer, isLoading, me]);

  // Get appropriate dashboard link based on role
  const dashboardLink = React.useMemo(() => {
    if (isLoading || !me) return '/admin/dashboard';
    if (isCashier) return '/admin/booking-lapangan';
    if (isAdminViewer) return '/admin/booking-lapangan';
    return '/admin/dashboard';
  }, [isCashier, isAdminViewer, isLoading, me]);

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
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:text-sidebar-foreground active:text-sidebar-foreground hover:bg-transparent active:bg-transparent"
            >
              <Link href={dashboardLink} prefetch>
                <Image
                  src="/favicon.ico"
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  className="size-8 shrink-0 rounded-lg object-contain"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Black Padel</span>
                  <span className="truncate text-xs">{subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navMainItems.map((item) => ({
            ...item,
            items: item.items?.filter(
              (child) =>
                !activeBranchId ||
                activeBranchId === 'cemara' ||
                !child.url?.includes('courtSport=TENNIS')
            )
          }))}
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
