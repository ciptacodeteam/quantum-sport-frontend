'use client';

import { ChevronRight } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import type { AppSidebarItem } from '@/types';
import Link from 'next/link';
import { Badge } from './badge';

export function NavMain({ items }: { items: AppSidebarItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <div className="flex w-full cursor-pointer items-center gap-2">
                        <item.icon />
                        <span>{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.url}>
                          <SidebarMenuSubButton asChild>
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
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <>
                  {item.url ? (
                    <SidebarMenuButton asChild tooltip={item.title}>
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
                    <SidebarMenuButton asChild tooltip={item.title}>
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
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
