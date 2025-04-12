'use client';

import * as React from "react";
import Link from "next/link";
import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  IconFileText,
} from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu as InnerSidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/components/ui/sidebar";

// Type for report items (can be shared or redefined if needed)
interface SidebarReportItem {
  name: string;
  url: string;
}

// Props specifically for this client component
export interface NavDocumentsContentProps {
  title: string;
  items: SidebarReportItem[];
  action?: React.ReactNode;
}

// The actual Client Component
export function NavDocumentsContent({ title, items, action }: NavDocumentsContentProps) {
  const { isMobile } = useSidebar(); // Hooks are allowed here

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
        {action}
      </div>
      {items.length > 0 ? (
        <InnerSidebarMenu className="flex flex-col gap-1 overflow-y-auto flex-1 pr-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <Link href={item.url} prefetch={true}>
                  <IconFileText className="h-4 w-4" />
                  <span className="truncate">{item.name}</span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    showOnHover
                    className="data-[state=open]:bg-accent rounded-sm"
                  >
                    <IconDots className="h-4 w-4" />
                    <span className="sr-only">More options for {item.name}</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-32 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                  sideOffset={5}
                >
                  <DropdownMenuItem>
                    <IconFolder className="mr-2 h-4 w-4" />
                    <span>View</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconShare3 className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                    <IconTrash className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
        </InnerSidebarMenu>
      ) : (
        <p className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
          No reports found.
        </p>
      )}
    </SidebarGroup>
  );
} 