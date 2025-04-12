import { getReportData } from "@/entities/report/api/data";

async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to get the id
  const { id } = await params;

  // Fetch report data using the imported function
  const reportData = await getReportData(id);

  // Render report details (add more details as needed)
  return (
    <div>
      <h1>Report Details</h1>
      <p>Report ID: {id}</p>
      <p>Status: {reportData.processingStatus}</p>
      <p>Title: {reportData.title}</p>
      <p>Patient Name: {reportData.patientName}</p>
      {/* Display other reportData fields as required */}

      {/* Placeholder for client-side initiation (details later) */}
      {reportData.processingStatus === 'completed' && (
         <div>
              {/* Trigger next generation phase here */}
              <p>Report processed. Ready for next phase.</p>
          </div>
      )}
       {reportData.processingStatus === 'failed' && (
         <div>
              <p style={{ color: 'red' }}>Report processing failed: {reportData.errorMessage}</p>
          </div>
      )}
    </div>
  );
}

export default ReportPage;