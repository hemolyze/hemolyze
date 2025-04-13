import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

interface TestResult {
    test: string;
    result: number | string; // Result might be numeric or string (e.g., "Not detected")
    unit?: string; // Make unit optional
    referenceRange?: {
        min?: number | string; // Allow string or number
        max?: number | string; // Allow string or number
        text?: string; // For textual ranges like "> 10" or "< 5"
    };
}

interface TestTableGroupProps {
    group: string;
    tests: TestResult[];
}

function isOutsideRange(result: number | string, range?: { min?: number | string; max?: number | string }): boolean {
    if (typeof result !== 'number' || !range) {
        return false; // Cannot determine range for non-numeric results or if range is missing
    }
    // Convert potential string range values to numbers for comparison
    const min = typeof range.min === 'string' ? parseFloat(range.min) : range.min;
    const max = typeof range.max === 'string' ? parseFloat(range.max) : range.max;

    if (min !== undefined && !isNaN(min) && result < min) {
        return true;
    }
    if (max !== undefined && !isNaN(max) && result > max) {
        return true;
    }
    return false;
}

function formatReferenceRange(range?: { min?: number | string; max?: number | string; text?: string }): string {
    if (!range) return 'N/A';
    if (range.text) return range.text; // Prioritize textual representation if available
    if (range.min !== undefined && range.max !== undefined) {
        return `${range.min} - ${range.max}`;
    }
    if (range.min !== undefined) {
        return `>= ${range.min}`;
    }
    if (range.max !== undefined) {
        return `<= ${range.max}`;
    }
    return 'N/A';
}


export default function TestTableGroup({ group, tests }: TestTableGroupProps) {
    console.log('table.tests', tests)
    return (
        <div className="w-full border rounded-lg overflow-hidden shadow-sm bg-card mb-6">
            <h3 className="text-lg font-semibold px-4 py-3 border-b bg-muted/40">{group}</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Test</TableHead>
                        <TableHead className="text-right">Result</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Reference Range</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tests.map((test, index) => {
                        const outsideRange = isOutsideRange(test.result, test.referenceRange);
                        return (
                            <TableRow key={index} className={cn(outsideRange ? "bg-red-50 dark:bg-red-900/20" : "")}>
                                <TableCell className="font-medium">{test.test}</TableCell>
                                <TableCell className={cn("text-right font-semibold", outsideRange ? "text-red-600 dark:text-red-400" : "")}>
                                    {test.result}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{test.unit}</TableCell>
                                <TableCell className="text-muted-foreground">{formatReferenceRange(test.referenceRange)}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
} 