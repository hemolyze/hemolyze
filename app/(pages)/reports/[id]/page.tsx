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

  // Render report details (add more details as needed)
  return (
    <div>
      <p className="text-xs">{
        JSON.stringify(reportData, null, 2)
      }</p>
      <h1>Report Details</h1>
      <p>Report ID: {id}</p>
      {/* Use overallStatus */}
      <p>Status: {reportData.overallStatus}</p>
      <p>Title: {reportData.title}</p>
      <p>Patient Name: {reportData.patientName}</p>
      {/* Display other fetched metadata fields */}
      <p>Patient Sex: {reportData.patientSex}</p>
      <p>Patient Age: {reportData.patientAge}</p>
      <p>Lab Name: {reportData.labName}</p>
      <p>Referring Doctor: {reportData.referringDoctor}</p>
      <p>Sample Date: {reportData.sampleDate}</p>
      <p>Report Date: {reportData.reportDate}</p>
      <p>Lab Director: {reportData.labDirector}</p>
      <p>Lab Contact: {reportData.labContact}</p>

      <hr style={{ margin: '20px 0' }} />

      <h2>Processing Status</h2>
      <p><strong>Overall Status:</strong> {reportData.overallStatus}</p>
      <ul>
        <li>Metadata Extraction: {reportData.metadataStatus} {reportData.metadataStatus === 'failed' ? `(${reportData.metadataError || 'Error'})` : ''}</li>
        <li>Blood Test Analysis: {reportData.testsStatus} {reportData.testsStatus === 'failed' ? `(${reportData.testsError || 'Error'})` : ''}</li>
        <li>Educational Content: {reportData.educationStatus} {reportData.educationStatus === 'failed' ? `(${reportData.educationError || 'Error'})` : ''}</li>
      </ul>

      {/* Conditional messages based on overall status */}
      {(reportData.overallStatus === 'processing' || reportData.overallStatus === 'partial') && (
        <div>
          <p>Report processing is ongoing...</p>
          {/* You could add a loading indicator here */}
        </div>
      )}

      {/* Check overallStatus */}
      {reportData.overallStatus === 'completed' && (
        <div>
          {/* Trigger next generation phase here */}
          <p style={{ color: 'green' }}>Report processing completed successfully.</p>
          {/* Placeholder for next phase initiation */}
        </div>
      )}
      {/* Check overallStatus and display specific error */}
      {reportData.overallStatus === 'failed' && (
        <div>
          {/* Display specific error */}
          <p style={{ color: 'red' }}>{getFailedPhaseError()}</p>
          {/* Optionally add a button to retry processing? */}
        </div>
      )}
      {/* You might want a specific UI for 'processing' or 'partial' statuses */}

    </div>
  );
}

export default ReportPage;