import MetadataViewer from "@/entities/report/components/MetadataViewer";
import TestViewer from "@/entities/report/components/TestViewer";
import { Suspense } from "react";
import MetadataViewerSkeleton from "@/entities/report/components/MetadataViewerSkeleton";
import TestViewerSkeleton from '@/entities/report/components/TestViewerSkeleton';

async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to get the id
  const { id } = await params;

  return (
    <div className="">
      <div className="flex flex-col h-full md:h-[calc(100vh-63px)] gap-2 overflow-y-scroll flex-1 mx-auto max-w-[1200px] no-scrollbar">
        <Suspense fallback={<MetadataViewerSkeleton />}>
          <MetadataViewer id={id} />
        </Suspense>
        <Suspense fallback={<TestViewerSkeleton />}>
          <TestViewer id={id} />
        </Suspense>
      </div>
    </div>
  )
}

export default ReportPage;