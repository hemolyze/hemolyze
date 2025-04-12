// Define the component signature to accept params
async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params to get the id
  const { id } = await params;

  // Return JSX displaying the id
  return <div>Report ID: {id}</div>;
}

export default ReportPage;