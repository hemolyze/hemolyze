import { getTestsData } from "@/entities/report/api/getTestsData";
import Gauge from "@/shared/components/ui/Gauge";
import TestTableGroup from "./TestTableGroup";
import TestInfoDialog from "./TestInfoDialog";
import { Suspense } from "react";

// Loading component with skeleton UI
function LoadingState() {
    return (
        <div className="w-full animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
                ))}
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded my-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
                ))}
            </div>
        </div>
    );
}

// Empty state component
function EmptyState({ message }: { message: string }) {
    return (
        <div className="w-full py-8 text-center">
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No data available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
        </div>
    );
}

export default async function TestViewer({ id }: { id: string }) {
    const data = await getTestsData(id);

    if (!data) {
        return (
            <div className="w-full">
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Error loading test results</span>
                    </div>
                    <p className="mt-1 ml-7 text-sm">Please try refreshing the page or contact support if the problem persists.</p>
                </div>
            </div>
        );
    }

    if (!data.testsData) {
        return (
            <div className="w-full">
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">No test data available</span>
                    </div>
                    <p className="mt-1 ml-7 text-sm">The system couldn&apos;t find any test results for this report.</p>
                </div>
            </div>
        );
    }

    const testData = data.testsData;
    const hasGaugeTests = testData.gauge && testData.gauge.length > 0;
    const hasTableTests = testData.table && testData.table.length > 0;

    return (
        <Suspense fallback={<LoadingState />}>
            <div className="w-full space-y-8 px-4">
                {/* Dashboard Header */}
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Test Results Dashboard</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {hasGaugeTests && `${testData.gauge.length} key metrics`}
                        {hasGaugeTests && hasTableTests && " • "}
                        {hasTableTests && `${testData.table.length} test groups`}
                    </p>
                  </div>
                </div>

                {/* Key Metrics Section */}
                {hasGaugeTests ? (
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Key Metrics</h3>
                            <div className="ml-2 h-px bg-gray-200 dark:bg-gray-700 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {testData.gauge.map((gauge) => (
                                <div className="w-full flex justify-center" key={gauge.test}>
                                    <div className="w-full max-w-[320px]">
                                        <Gauge options={{
                                            title: gauge.test,
                                            minValue: gauge.gaugeMin,
                                            maxValue: gauge.gaugeMax,
                                            lowThreshold: gauge.referenceRange?.min as number,
                                            highThreshold: gauge.referenceRange?.max as number,
                                            initialValue: gauge.result as number,
                                            unit: gauge.unit,
                                        }} infoDialog={<TestInfoDialog reportId={id} testDetails={{
                                            testName: gauge.test,
                                            testId: String(gauge._id),
                                            result: gauge.result as string,
                                            unit: gauge.unit as string,
                                            referenceRange: {
                                                min: gauge.referenceRange?.min as number,
                                                max: gauge.referenceRange?.max as number,
                                            },
                                        }} cardStyle={true} />} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <EmptyState message="No key metrics available for this report" />
                )}

                {/* Detailed Test Results Section */}
                {hasTableTests ? (
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Detailed Test Results</h3>
                            <div className="ml-2 h-px bg-gray-200 dark:bg-gray-700 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 w-full">
                            {testData.table.map(table => (
                                // @ts-expect-error - improve type inference
                                <TestTableGroup key={table.group} group={table.group} tests={table.tests} reportId={id} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <EmptyState message="No detailed test results available for this report" />
                )}
            </div>
        </Suspense>
    );
}
