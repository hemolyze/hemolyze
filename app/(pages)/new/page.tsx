import { AppSidebar } from "@/shared/components/app-sidebar";
import { SiteHeader } from "@/shared/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/shared/components/ui/sidebar";
import FileUploadCard from "@/features/report-upload/components/FileUploadCard";

export default function NewReportPage() {
  return (
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
        <div className="flex flex-1 flex-col">
          <main className="flex flex-1 items-center justify-center p-8 md:p-12 lg:p-16">
            <FileUploadCard />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 