import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import RangeBar from "@/shared/components/ui/RangeBar";
import TestInfoDialog from "./TestInfoDialog";

interface TestResult {
    _id?: string; // Make _id optional to match potential source type
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
    reportId: string;
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
    if (range.text) return range.text;
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


export default function TestTableGroup({ reportId, group, tests }: TestTableGroupProps) {
    return (
        <div className="w-full border rounded-lg overflow-hidden shadow-sm bg-card mb-6">
            <h3 className="text-lg font-semibold px-4 py-3 border-b bg-muted/40">{group}</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[35%]">Test</TableHead>
                        <TableHead className="w-[15%] text-right">Result</TableHead>
                        <TableHead className="w-[10%]">Unit</TableHead>
                        <TableHead className="w-[40%]">Reference Range</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tests.map((test) => {
                        const outsideRange = isOutsideRange(test.result, test.referenceRange);
                        const minRangeNum = typeof test.referenceRange?.min === 'string'
                            ? parseFloat(test.referenceRange.min)
                            : test.referenceRange?.min;
                        const maxRangeNum = typeof test.referenceRange?.max === 'string'
                            ? parseFloat(test.referenceRange.max)
                            : test.referenceRange?.max;
                        const resultNum = typeof test.result === 'number' ? test.result : NaN;

                        return (
                            <TableRow key={test._id!} className={cn("h-[60px]", outsideRange ? "bg-red-50 dark:bg-red-900/20" : "")}>
                                <TableCell className="font-medium align-top pt-3">
                                    <div className="flex items-center justify-between">
                                        <span>{test.test}</span>
                                        <TestInfoDialog reportId={reportId} testDetails={{
                                            testName: test.test,
                                            testId: String(test._id),
                                            result: test.result as string,
                                            unit: test.unit as string,
                                            referenceRange: {
                                                min: test.referenceRange?.min as number,
                                                max: test.referenceRange?.max as number,
                                            },
                                        }} />
                                    </div>
                                </TableCell>
                                <TableCell className={cn("text-right font-semibold align-top pt-3", outsideRange ? "text-red-600 dark:text-red-400" : "")}>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className={cn(
                                            "h-2 w-2 rounded-full",
                                            outsideRange ? "bg-red-500" : "bg-green-500"
                                        )}></span>
                                        {test.result}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground align-top pt-3">{test.unit ?? 'N/A'}</TableCell>
                                <TableCell className="align-middle">
                                    {(typeof resultNum === 'number' && !isNaN(resultNum) && (minRangeNum !== undefined || maxRangeNum !== undefined)) ? (
                                        <RangeBar
                                            result={resultNum}
                                            minRange={minRangeNum}
                                            maxRange={maxRangeNum}
                                            unit={test.unit}
                                        />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            {formatReferenceRange(test.referenceRange)}
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
} 