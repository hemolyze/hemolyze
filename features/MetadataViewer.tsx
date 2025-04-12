import React from 'react'
import { getReportMetadata } from '@/entities/report/api/getMetadata';
const MetadataViewer = async ({ id }: { id: string }) => {
    const report = await getReportMetadata(id);
    return (
        <div>
            <h1>Metadata Viewer</h1>
            <pre>{JSON.stringify(report, null, 2)}</pre>
        </div>
    )
}

export default MetadataViewer