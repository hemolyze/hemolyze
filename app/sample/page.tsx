export default function SampleReportPage() {
  return (
    <main className="flex min-h-[calc(100vh-theme(spacing.14))] flex-col items-center p-8 md:p-12 lg:p-16 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Sample Report Visualization</h1>
        {/* Placeholder for sample visualization components */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600 text-center">Sample report data and visualizations will be displayed here.</p>
          {/* Example: Gauge, chart, table placeholders */}
          <div className="mt-8 space-y-6">
            <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">Gauge Placeholder</div>
            <div className="h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">Chart Placeholder</div>
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400">Table Placeholder</div>
          </div>
        </div>
      </div>
    </main>
  );
} 