'use client';

import * as React from 'react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import type { AppSidebarItem } from '@/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavSecondary({
  items,
  ...props
}: {
  items: AppSidebarItem[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  // Check if a URL matches the current pathname
  const isActive = (url?: string) => {
    if (!url) return false;
    // For external links (like WhatsApp), check if it matches exactly
    if (url.startsWith('http')) {
      return false; // External links shouldn't be marked as active
    }
    // Exact match or starts with the URL (for nested routes)
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const itemIsActive = isActive(item.url);
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm" isActive={itemIsActive}>
                  <Link href={item.url || '#'} prefetch>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
