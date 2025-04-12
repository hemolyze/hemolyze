import { AppSidebar } from "@/shared/components/app-sidebar";
import { SiteHeader } from "@/shared/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/shared/components/ui/sidebar";

const PagesLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='w-full h-full fixed top-0 left-0 right-0 bottom-0 overflow-hidden'>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}

export default PagesLayout