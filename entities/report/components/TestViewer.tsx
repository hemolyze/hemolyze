import { getTestsData } from "@/entities/report/api/getTestsData";
import Gauge from "@/shared/components/ui/Gauge";

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
    </div>;
}
