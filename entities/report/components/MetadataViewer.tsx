import React from 'react'
import { getReportMetadata } from '@/entities/report/api/getMetadata';

// Adjust the type to handle potentially undefined fields from getReportMetadata
// Assuming the actual returned type might have optional fields
interface ReportMetadata {
  _id?: string; // Add _id back if it's needed for display
  title?: string;
  patientName?: string;
  patientSex?: string;
  labName?: string;
  patientAge?: string;
  referringDoctor?: string;
  sampleDate?: string;
  reportDate?: string;
  labDirector?: string;
  labContact?: string;
}

const MetadataViewer = async ({ id }: { id: string }) => {
    // Fetch metadata, type assertion might be needed if getReportMetadata's return type is known
    const report: ReportMetadata | null = await getReportMetadata(id);

    if (!report) {
        return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Metadata not found for report ID: {id}</div>;
    }

    // Helper to render data or a placeholder
    const renderData = (value: string | undefined) => value ?? <span className="text-slate-400 italic">N/A</span>;

    return (
        <section className="p-4 text-sm">
            {/* Title */}
            <h2 className="text-xl font-semibold text-slate-800 mb-1">{report.title ?? 'Report Details'}</h2>
            {/* Report ID */}
            <p className="text-xs text-slate-500 mb-4 pb-3 border-b border-slate-200">Report ID: {id}</p>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-4"> {/* Increased gap-x */}
                {/* Patient Details Column */}
                <div>
                    <h3 className="text-base font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-200">Patient Details</h3>
                    <dl className="space-y-1.5">
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Name:</dt> {/* Updated Label Style */}
                            <dd className="text-slate-800 text-right">{renderData(report.patientName)}</dd> {/* Updated Value Style */}
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Age:</dt>
                            <dd className="text-slate-800 text-right">{renderData(report.patientAge)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Sex:</dt>
                            <dd className="text-slate-800 text-right">{renderData(report.patientSex)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Referring Doctor:</dt>
                            <dd className="text-slate-800 text-right">{renderData(report.referringDoctor)}</dd>
                        </div>
                    </dl>
                </div>

                {/* Report & Lab Info Column */}
                <div>
                    <h3 className="text-base font-semibold text-slate-700 mb-3 pb-1 border-b border-slate-200">Report & Lab Information</h3>
                    <dl className="space-y-1.5">
                         <div className="flex justify-between">
                            <dt className="text-slate-500">Report Date:</dt>
                            <dd className="text-slate-800 text-right">{renderData(report.reportDate)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Sample Date:</dt>
                            <dd className="text-slate-800 text-right">{renderData(report.sampleDate)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Lab Name:</dt>
                            <dd className="text-slate-800 text-right">{renderData(report.labName)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Lab Director:</dt>
                            <dd className="text-slate-800 text-right">{renderData(report.labDirector)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Lab Contact:</dt>
                            <dd className="text-slate-800 text-right">{renderData(report.labContact)}</dd> {/* Moved Lab Contact */}
                        </div>
                    </dl>
                </div>
            </div>

             {/* Removed Footer Info - moved Lab Contact to column above */}
             {/* Optional: Add a final border if needed below the grid */}
             {/* <div className="border-t border-slate-200"></div> */}
        </section>
    )
}

export default MetadataViewer