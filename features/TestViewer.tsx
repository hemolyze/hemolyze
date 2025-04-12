import { getTestsData } from "@/entities/report/api/getTestsData";

export default async function TestViewer({ id }: { id: string }) {
    const testsData = await getTestsData(id);
    return <div className="flex flex-col gap-2">
        <h1>Test Viewer</h1>
        <pre className="text-xs">{JSON.stringify(testsData, null, 2)}</pre>
    </div>;
}
