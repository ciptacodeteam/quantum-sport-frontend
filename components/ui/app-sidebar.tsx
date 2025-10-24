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
import { getWhatsappMessageUrl } from '@/lib/utils';
import {
  IconAd2,
  IconCategory,
  IconDatabase,
  IconDogBowl,
  IconShoppingCart,
  IconUser,
  IconUsers
} from '@tabler/icons-react';
import Link from 'next/link';
import { SUPPORT_CIPTACODE_PHONE_NUMBER } from '@/lib/constants';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin/dashboard',
      icon: IconCategory,
      items: []
    },
    {
      title: 'Kelola Kustomer',
      url: '/admin/kelola-kustomer',
      icon: IconUsers,
      items: []
    },
    {
      title: 'Kelola Produk',
      url: '/admin/kelola-produk',
      icon: IconDogBowl,
      items: []
    },
    {
      title: 'Penjualan',
      icon: IconShoppingCart,
      items: [
        {
          title: 'Kelola Transaksi',
          url: '/admin/kelola-transaksi'
        },
        {
          title: 'Kelola Kupon',
          url: '/admin/kelola-kupon'
        }
      ]
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
          title: 'Kelola Roles',
          url: '/admin/kelola-roles'
        },
        {
          title: 'Kelola Hak Akses',
          url: '/admin/kelola-hak-akses'
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
        },
        {
          title: 'Kelola Pengumuman',
          url: '/admin/kelola-pengumuman'
        }
      ]
    },
    {
      title: 'Master Data',
      icon: IconDatabase,
      items: [
        {
          title: 'Kelola Kategori',
          url: '/admin/kelola-kategori'
        },
        {
          title: 'Kelola Sub Kategori',
          url: '/admin/kelola-sub-kategori'
        },
        {
          title: 'Kelola Akun Bank',
          url: '/admin/kelola-akun-bank'
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
