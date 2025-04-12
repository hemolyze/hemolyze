import MetadataViewer from "@/features/MetadataViewer";
import TestViewer from "@/features/TestViewer";
import { Suspense } from "react";
import MetadataViewerSkeleton from "@/features/MetadataViewerSkeleton";

async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to get the id
  const { id } = await params;

  return <div className="flex flex-col gap-2">
    <Suspense fallback={<MetadataViewerSkeleton />}>
      <MetadataViewer id={id} />
    </Suspense>
    <Suspense fallback={<div>Loading Tests...</div>}>
      <TestViewer id={id} />
    </Suspense>
  </div>
}

export default ReportPage;