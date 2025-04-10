export default function NewReportPage() {
  return (
    <main className="flex min-h-[calc(100vh-theme(spacing.14))] flex-col items-center justify-center p-8 md:p-12 lg:p-16 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-4">Upload New Report</h1>
        <p className="text-gray-600 mb-8">Drag and drop your report file here or click to browse.</p>
        {/* Placeholder for file upload component */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 bg-white">
          <p className="text-gray-400">File Upload Area</p>
        </div>
      </div>
    </main>
  );
} 