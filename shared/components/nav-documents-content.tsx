'use client';

import * as React from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Folder,
  Share,
  Trash2,
  FileText,
} from "lucide-react";

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
  status: string;
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
                  <FileText className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    <span className="truncate">{item.name}</span>
                  </span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    showOnHover
                    className="data-[state=open]:bg-accent rounded-sm"
                  >
                    <MoreHorizontal className="h-4 w-4" />
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
                    <Folder className="mr-2 h-4 w-4" />
                    <span>View</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                    <Trash2 className="mr-2 h-4 w-4" />
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