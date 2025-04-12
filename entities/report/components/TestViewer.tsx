// import { getTestsData } from "@/entities/report/api/getTestsData";
import Gauge from "@/shared/components/ui/Gauge";

export default async function TestViewer({ id }: { id: string }) {
    console.log("TestViewer", id);
    // const testsData = await getTestsData(id);
    const data = {
        "test": "Hemoglobin (Hb)",
        "result": 10.2,
        "unit": "g/dL",
        "referenceRange": {
            "min": 13.5,
            "max": 17.5
        },
        "interpretation": "Low",
        "gaugeMin": 8,
        "gaugeMax": 20
    }
    return <div className="flex flex-col gap-2">
        <h1>Test Viewer</h1>
        <Gauge options={{
            title: data.test + " " + data.unit,
            minValue: data.gaugeMin,
            maxValue: data.gaugeMax,
            lowThreshold: data.referenceRange.min,
            highThreshold: data.referenceRange.max,
            initialValue: data.result,
            unit: data.unit,
        }} />
        {/* <pre className="text-xs">{JSON.stringify(testsData, null, 2)}</pre> */}
    </div>;
}
