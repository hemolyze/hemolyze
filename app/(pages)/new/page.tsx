import { AppSidebar } from "@/shared/components/app-sidebar";
import { SiteHeader } from "@/shared/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/shared/components/ui/sidebar";

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
            <div className="w-full max-w-2xl text-center">
              <h1 className="text-3xl font-bold mb-4">Upload New Report</h1>
              <p className="text-gray-600 mb-8">Drag and drop your report file here or click to browse.</p>
              {/* Placeholder for file upload component */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 bg-white">
                <p className="text-gray-400">File Upload Area</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 