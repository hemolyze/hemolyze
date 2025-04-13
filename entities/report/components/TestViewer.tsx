import { getTestsData } from "@/entities/report/api/getTestsData";
import Gauge from "@/shared/components/ui/Gauge";
import TestTableGroup from "./TestTableGroup";

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
            }} key={gauge.test} />
        ))}
        <hr className="w-full border-t border-gray-200 my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full p-4">
            {testData.table.map(table => (
                <TestTableGroup key={table.group} group={table.group} tests={table.tests} />
            ))}
        </div>

    </div>;
}
