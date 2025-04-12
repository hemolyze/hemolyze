import MetadataViewer from "@/features/MetadataViewer";
import { Suspense } from "react";

async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to get the id
  const { id } = await params;

  return <div className="flex flex-col gap-2">
    <h1>Report Page</h1>
    <Suspense fallback={<div>Loading Metadata...</div>}>
      <MetadataViewer id={id} />
    </Suspense>
  </div>
}

export default ReportPage;