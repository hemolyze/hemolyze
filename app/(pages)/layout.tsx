// import { Suspense } from "react"; // Remove unused Suspense import
import { AppSidebar } from "@/shared/components/app-sidebar";
// import { AppSidebarSkeleton } from "@/shared/components/app-sidebar-skeleton"; // Skeleton import already removed
import { SiteHeader } from "@/shared/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/shared/components/ui/sidebar";

const PagesLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='w-full h-full  overflow-hidden'>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset className="overflow-hidden">
                    <SiteHeader />
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}

export default PagesLayout