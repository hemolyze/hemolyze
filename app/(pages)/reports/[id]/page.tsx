import MetadataViewer from "@/entities/report/components/MetadataViewer";
import TestViewer from "@/entities/report/components/TestViewer";
import { Suspense } from "react";
import MetadataViewerSkeleton from "@/entities/report/components/MetadataViewerSkeleton";
import TestViewerSkeleton from '@/entities/report/components/TestViewerSkeleton';
import Chatbot from '@/shared/components/ui/Chatbot';
import { connect } from "@/lib/db";
import Report, { IReport, BloodTestsData } from "@/lib/models/Report"; // Import relevant types
import { notFound } from 'next/navigation';

// Define the structure for the richer report context
interface ReportChatContext {
  metadata: {
    patientName?: string | null;
    patientAge?: string | null;
    patientSex?: string | null;
    referringDoctor?: string | null;
    labName?: string | null;
    sampleDate?: string | null;
    reportDate?: string | null;
    labDirector?: string | null;
    labContact?: string | null;
  };
  testsData?: BloodTestsData | null; // Include the structured tests data
}

async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let reportContext: ReportChatContext | null = null;
  let reportFound = true;

  try {
    await connect();
    // Fetch the report with all required fields, explicitly typing the result
    const report = await Report.findOne({ _id: id })
      .select('patientName patientAge patientSex referringDoctor labName sampleDate reportDate labDirector labContact testsData') 
      .lean()
      .exec() as Pick<IReport, 
        'patientName' | 'patientAge' | 'patientSex' | 'referringDoctor' | 
        'labName' | 'sampleDate' | 'reportDate' | 'labDirector' | 'labContact' | 
        'testsData'
      > | null;

    if (!report) {
      reportFound = false;
    } else {
      // Construct the richer context object
      reportContext = {
        metadata: {
          patientName: report.patientName,
          patientAge: report.patientAge,
          patientSex: report.patientSex,
          referringDoctor: report.referringDoctor,
          labName: report.labName,
          sampleDate: report.sampleDate,
          reportDate: report.reportDate,
          labDirector: report.labDirector,
          labContact: report.labContact,
        },
        testsData: report.testsData, // Directly assign testsData
      };
    }
  } catch (error) {
    console.error("Error fetching report data:", error);
    reportFound = false; 
  }

  if (!reportFound) {
    notFound();
  }

  return (
    <div className="flex relative">
      <div className="flex flex-col h-full md:h-[calc(100vh-63px)] gap-2 overflow-y-scroll flex-1 mx-auto max-w-[1200px] no-scrollbar">
        <Suspense fallback={<MetadataViewerSkeleton />}>
          <MetadataViewer id={id} />
        </Suspense>
        <Suspense fallback={<TestViewerSkeleton />}>
          <TestViewer id={id} />
        </Suspense>
      </div>
      {/* Pass the richer report context to Chatbot */}
      <Chatbot reportContext={JSON.stringify(reportContext)} />
    </div>
  )
}

export default ReportPage;