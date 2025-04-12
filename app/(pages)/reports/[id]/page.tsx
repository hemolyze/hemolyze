import MetadataViewer from "@/entities/report/components/MetadataViewer";
import TestViewer from "@/entities/report/components/TestViewer";
import { Suspense } from "react";
import MetadataViewerSkeleton from "@/entities/report/components/MetadataViewerSkeleton";

async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to get the id
  const { id } = await params;

  return <div className="flex flex-col gap-2 max-h-[calc(100vh-48px)] overflow-y-auto">
    <Suspense fallback={<MetadataViewerSkeleton />}>
      <MetadataViewer id={id} />
    </Suspense>
    <Suspense fallback={<div>Loading Tests...</div>}>
      <TestViewer id={id} />
    </Suspense>
  </div>
}

export default ReportPage;