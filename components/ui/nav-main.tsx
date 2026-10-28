'use client';

import { ChevronRight } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import type { AppSidebarItem } from '@/types';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Badge } from './badge';

export function NavMain({ items }: { items: AppSidebarItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if a URL matches the current pathname
  const isActive = (url?: string) => {
    if (!url) return false;
    const [itemPathname, itemQueryString] = url.split('?');

    if (itemQueryString) {
      if (pathname !== itemPathname) return false;

      const itemSearchParams = new URLSearchParams(itemQueryString);
      return Array.from(itemSearchParams.entries()).every(
        ([key, value]) => searchParams.get(key) === value
      );
    }

    // Exact match or starts with the URL (for nested routes)
    return pathname === itemPathname || pathname.startsWith(`${itemPathname}/`);
  };

  // Check if any sub-item is active
  const hasActiveSubItem = (subItems?: AppSidebarItem['items']) => {
    if (!subItems) return false;
    return subItems.some((subItem) => isActive(subItem.url));
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const itemIsActive = isActive(item.url) || hasActiveSubItem(item.items);

          return (
            <Collapsible key={item.title} asChild defaultOpen={itemIsActive}>
              <SidebarMenuItem>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="group hover:bg-muted hover:text-sidebar-foreground active:bg-muted active:text-sidebar-foreground data-[state=open]:hover:bg-muted data-[state=open]:hover:text-sidebar-foreground cursor-pointer"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const subItemIsActive = isActive(subItem.url);

                          return (
                            <SidebarMenuSubItem key={subItem.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={subItemIsActive}
                                className={
                                  subItemIsActive
                                    ? undefined
                                    : 'hover:bg-muted hover:text-sidebar-foreground active:bg-muted active:text-sidebar-foreground'
                                }
                              >
                                <Link href={subItem.url} prefetch>
                                  <span>{subItem.title}</span>
                                  {subItem.isUnrealeased && (
                                    <Badge variant="secondary" className="ml-auto">
                                      Soon
                                    </Badge>
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <>
                    {item.url ? (
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={itemIsActive}
                        className={
                          itemIsActive
                            ? undefined
                            : 'hover:bg-muted hover:text-sidebar-foreground active:bg-muted active:text-sidebar-foreground'
                        }
                      >
                        <Link href={item.url} prefetch>
                          <item.icon />
                          <span>{item.title}</span>
                          {item.isUnrealeased && (
                            <Badge variant="secondary" className="ml-auto">
                              Soon
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={itemIsActive}
                        className={
                          itemIsActive
                            ? undefined
                            : 'hover:bg-muted hover:text-sidebar-foreground active:bg-muted active:text-sidebar-foreground'
                        }
                      >
                        <div className="flex w-full cursor-pointer items-center gap-2">
                          <item.icon />
                          <span>{item.title}</span>
                        </div>
                        {item.isUnrealeased && (
                          <Badge variant="secondary" className="ml-auto">
                            Soon
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    )}
                  </>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
