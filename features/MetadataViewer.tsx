import React from 'react'
import { getReportMetadata } from '@/entities/report/api/getMetadata';

// Adjust the type to handle potentially undefined fields from getReportMetadata
// Assuming the actual returned type might have optional fields
interface ReportMetadata {
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
        return <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">Metadata not found for report ID: {id}</div>;
    }

    // Helper to render data or a placeholder
    const renderData = (value: string | undefined) => value ?? <span className="text-gray-400 italic">N/A</span>;

    return (
        <section className="p-4 text-sm">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">{report.title ?? 'Report Details'}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4">
                <dl className="space-y-1.5">
                    <div className="flex justify-between">
                        <dt className="font-medium text-slate-600">Patient Name:</dt>
                        <dd className="text-slate-900 font-medium text-right">{renderData(report.patientName)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="font-medium text-slate-600">Age:</dt>
                        <dd className="text-slate-900 font-medium text-right">{renderData(report.patientAge)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="font-medium text-slate-600">Sex:</dt>
                        <dd className="text-slate-900 font-medium text-right">{renderData(report.patientSex)}</dd>
                    </div>
                     <div className="flex justify-between">
                        <dt className="font-medium text-slate-600">Referring Doctor:</dt>
                        <dd className="text-slate-900 font-medium text-right">{renderData(report.referringDoctor)}</dd>
                    </div>
                </dl>

                <dl className="space-y-1.5">
                     <div className="flex justify-between">
                        <dt className="font-medium text-slate-600">Lab Name:</dt>
                        <dd className="text-slate-900 font-medium text-right">{renderData(report.labName)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="font-medium text-slate-600">Sample Date:</dt>
                        <dd className="text-slate-900 font-medium text-right">{renderData(report.sampleDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="font-medium text-slate-600">Report Date:</dt>
                        <dd className="text-slate-900 font-medium text-right">{renderData(report.reportDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="font-medium text-slate-600">Lab Director:</dt>
                        <dd className="text-slate-900 font-medium text-right">{renderData(report.labDirector)}</dd>
                    </div>
                </dl>
            </div>

             <div className="pt-3 border-t border-slate-200 text-center text-xs text-slate-500">
                <p>{renderData(report.labContact)}</p>
            </div>
        </section>
    )
}

export default MetadataViewer