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
import { SUPPORT_CIPTACODE_PHONE_NUMBER } from '@/lib/constants';
import { getWhatsappMessageUrl } from '@/lib/utils';
import {
  IconAd2,
  IconCategory,
  IconDatabase,
  IconLaurelWreath1,
  IconScan,
  IconSchool,
  IconShoppingCart,
  IconUser,
  IconUsers,
  IconUsersGroup
} from '@tabler/icons-react';
import Link from 'next/link';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin/dashboard',
      icon: IconCategory,
      items: []
    },

    {
      title: 'Kelola Pemesanan',
      icon: IconScan,
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
          title: 'Ballboy',
          url: '/admin/kelola-pemesanan/ballboy'
        },
        {
          title: 'Coach',
          url: '/admin/kelola-pemesanan/coach'
        }
      ]
    },
    {
      title: 'Penjualan',
      icon: IconShoppingCart,
      items: [
        {
          title: 'Kelola Transaksi',
          url: '/admin/kelola-transaksi'
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
        },
        {
          title: 'Kustomer Membership',
          url: '/admin/kelola-kustomer/membership'
        }
      ]
    },
    {
      title: 'Kelola Kelas',
      url: '/admin/kelola-kelas',
      icon: IconSchool,
      items: []
    },
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
      title: 'Karyawan',
      icon: IconUser,
      items: [
        {
          title: 'Kelola Karyawan',
          url: '/admin/kelola-karyawan'
        },
        {
          title: 'Kelola Coach',
          url: '/admin/kelola-coach'
        },
        {
          title: 'Kelola Ballboy',
          url: '/admin/kelola-ballboy'
        },
        {
          title: 'Roles',
          url: '/admin/kelola-roles'
        }
      ]
    },

    {
      title: 'Marketing',
      icon: IconAd2,
      items: [
        {
          title: 'Kelola Banner',
          url: '/admin/kelola-banner'
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
          title: 'Kelola Tipe Coach',
          url: '/admin/kelola-tipe-coach'
        },
        {
          title: 'Kelola Payment Method',
          url: '/admin/kelola-payment-method'
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
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/dashboard" prefetch>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Quantum Sport</span>
                  <span className="truncate text-xs">Dashboard Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
