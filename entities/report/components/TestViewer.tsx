import { getTestsData } from "@/entities/report/api/getTestsData";
import Gauge from "@/shared/components/ui/Gauge";
import TestTableGroup from "./TestTableGroup";
import TestInfoDialog from "./TestInfoDialog";

export default async function TestViewer({ id }: { id: string }) {
    const data = await getTestsData(id);

    if (!data) {
        return <p>No data found</p>
    }

    if (!data.testsData) {
        return <p>No tests data found</p>
    }

    const testData = data.testsData;

    return <div className="flex flex-wrap gap-4 justify-center">
        {testData.gauge.map((gauge) => (
            <Gauge options={{
                title: gauge.test,
                minValue: gauge.gaugeMin,
                maxValue: gauge.gaugeMax,
                lowThreshold: gauge.referenceRange?.min as number,
                highThreshold: gauge.referenceRange?.max as number,
                initialValue: gauge.result as number,
                unit: gauge.unit,
            }} key={gauge.test} infoDialog={<TestInfoDialog reportId={id} testDetails={{
                testName: gauge.test,
                testId: String(gauge._id),
                result: gauge.result as string,
                unit: gauge.unit as string,
                referenceRange: {
                    min: gauge.referenceRange?.min as number,
                    max: gauge.referenceRange?.max as number,
                },
            }} />} />
        ))}
        <hr className="w-full border-t border-gray-200 my-4" />
        <div className="grid grid-cols-1 gap-4 w-full p-4">
            {testData.table.map(table => (
                // @ts-expect-error - improve type inference
                <TestTableGroup key={table.group} group={table.group} tests={table.tests} />
            ))}
        </div>

    </div>;
}
