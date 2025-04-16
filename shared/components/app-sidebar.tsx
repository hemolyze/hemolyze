import * as React from "react"
import { Suspense } from "react"
import Link from "next/link";

import { NavDocuments } from "@/shared/components/nav-documents"
import { NavDocumentsSkeleton } from "@/shared/components/nav-documents-skeleton"
import { NavUser } from "@/shared/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar"
// import { getReportsForSidebar } from "@/entities/report/api/queries"

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" />
      <path d="M12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12Z" fill="currentColor" />
    </svg>
    <span className="font-semibold text-lg text-gray-900">Hemolyze</span>
  </div>
);

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // const reportsPromise = getReportsForSidebar();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Logo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<NavDocumentsSkeleton />}>
          <NavDocuments
            title="Reports"
            // reportsPromise={reportsPromise}
          />
        </Suspense>
        <div className="mt-auto">
        {/* <NavSecondary className="mt-auto" /> */}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
