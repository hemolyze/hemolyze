import { getReportData } from "@/entities/report/api/data";

async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to get the id
  const { id } = await params;

  // Fetch report data using the imported function
  // This will trigger metadata processing if overallStatus is 'pending'
  const reportData = await getReportData(id);

  // Function to determine which phase failed if overall status is 'failed'
  const getFailedPhaseError = (): string | null => {
    if (reportData.metadataStatus === 'failed' && reportData.metadataError) return `Metadata Extraction Failed: ${reportData.metadataError}`;
    if (reportData.testsStatus === 'failed' && reportData.testsError) return `Blood Test Analysis Failed: ${reportData.testsError}`;
    if (reportData.educationStatus === 'failed' && reportData.educationError) return `Educational Content Generation Failed: ${reportData.educationError}`;
    return "Processing failed, but specific error details are unavailable."; // Fallback
  }

  // Helper to display data or a fallback
  function displayValue(value: string | undefined | null): string {
    return (value && value !== 'not found') ? value : "Not Available";
  }

  return (
    <div className="p-6 space-y-8">
      {/* Remove Debug Output */}
      {/* <p className="text-xs">{JSON.stringify(reportData, null, 2)}</p> */}

      {/* Report Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {displayValue(reportData.title)}
        </h1>
        <p className="text-sm text-gray-500">Report ID: {id}</p>
      </header>

      {/* Metadata Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Patient Details Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Patient Details
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Name</dt>
              <dd className="text-sm text-gray-800 text-right">{displayValue(reportData.patientName)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Age</dt>
              <dd className="text-sm text-gray-800 text-right">{displayValue(reportData.patientAge)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Sex</dt>
              <dd className="text-sm text-gray-800 text-right">{displayValue(reportData.patientSex)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Referring Doctor</dt>
              <dd className="text-sm text-gray-800 text-right">{displayValue(reportData.referringDoctor)}</dd>
            </div>
          </dl>
        </section>

        {/* Report & Lab Details Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Report & Lab Information
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Report Date</dt>
              <dd className="text-sm text-gray-800 text-right">{displayValue(reportData.reportDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Sample Date</dt>
              <dd className="text-sm text-gray-800 text-right">{displayValue(reportData.sampleDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Lab Name</dt>
              <dd className="text-sm text-gray-800 text-right">{displayValue(reportData.labName)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Lab Director</dt>
              <dd className="text-sm text-gray-800 text-right">{displayValue(reportData.labDirector)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Lab Contact</dt>
              <dd className="text-sm text-gray-800 text-right">{displayValue(reportData.labContact)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Processing Status Section */}
      <section className="mt-8 pt-6 border-t">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Processing Status</h2>
        <div className="p-4 bg-gray-50 rounded-md text-sm space-y-2">
          <p><strong>Overall Status:</strong> <span className={`font-medium ${reportData.overallStatus === 'completed' ? 'text-green-600' : reportData.overallStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>{reportData.overallStatus}</span></p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Metadata Extraction: {reportData.metadataStatus} {reportData.metadataStatus === 'failed' ? <span className="text-red-600">{`(${reportData.metadataError || 'Error'})`}</span> : ''}</li>
            <li>Blood Test Analysis: {reportData.testsStatus} {reportData.testsStatus === 'failed' ? <span className="text-red-600">{`(${reportData.testsError || 'Error'})`}</span> : ''}</li>
            <li>Educational Content: {reportData.educationStatus} {reportData.educationStatus === 'failed' ? <span className="text-red-600">{`(${reportData.educationError || 'Error'})`}</span> : ''}</li>
          </ul>

          {/* Conditional messages based on overall status */}
          {(reportData.overallStatus === 'processing' || reportData.overallStatus === 'partial') && (
            <p className="text-blue-600 italic mt-2">Report processing is ongoing...</p>
          )}
          {reportData.overallStatus === 'completed' && (
            <p className="text-green-600 font-medium mt-2">Report processing completed successfully.</p>
          )}
          {reportData.overallStatus === 'failed' && (
            <p className="text-red-600 font-medium mt-2">{getFailedPhaseError()}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ReportPage;