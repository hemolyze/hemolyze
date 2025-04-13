import { cn } from "@/shared/lib/utils";
import React from 'react';

interface RangeBarProps {
    result: number;
    minRange?: number;
    maxRange?: number;
    unit?: string;
}

const RangeBar: React.FC<RangeBarProps> = ({
    result,
    minRange,
    maxRange,
    unit = '',
}) => {
    // Determine the overall scale of the bar
    let displayMin: number;
    let displayMax: number;

    const validMin = minRange !== undefined && !isNaN(minRange);
    const validMax = maxRange !== undefined && !isNaN(maxRange);

    if (!validMin && !validMax) {
        // Cannot display range if no bounds are valid
        return <span className="text-xs text-muted-foreground">N/A</span>;
    }

    if (validMin && validMax) {
        const rangeWidth = maxRange! - minRange!;
        // Ensure rangeWidth is not negative or zero for padding calculation
        const safeRangeWidth = Math.max(rangeWidth, Math.abs(result - minRange!), Math.abs(maxRange! - result), 1);
        const padding = safeRangeWidth * 0.3; // 30% padding around range/result
        displayMin = Math.min(result, minRange!) - padding;
        displayMax = Math.max(result, maxRange!) + padding;
    } else if (validMin) {
        const padding = Math.abs(result - minRange!) * 0.5 || minRange! * 0.2 || 5; // Dynamic or default padding
        displayMin = Math.min(result, minRange!) - padding;
        displayMax = Math.max(result, minRange!) + padding;
    } else { // Only validMax
        const padding = Math.abs(maxRange! - result) * 0.5 || maxRange! * 0.2 || 5;
        displayMin = Math.min(result, maxRange!) - padding;
        displayMax = Math.max(result, maxRange!) + padding;
    }

    // Avoid division by zero or negative range
    if (displayMax <= displayMin) {
         displayMax = displayMin + 10; // Add a default span if bounds collapse
    }

    const totalSpan = displayMax - displayMin;

    // Calculate percentage positions - clamped between 0 and 100
    const calculatePercent = (value: number) => {
       const percent = ((value - displayMin) / totalSpan) * 100;
       return Math.max(0, Math.min(100, percent));
    };

    const resultPercent = calculatePercent(result);
    const rangeStartPercent = validMin ? calculatePercent(minRange!) : 0;
    const rangeEndPercent = validMax ? calculatePercent(maxRange!) : 100;
    const rangeWidthPercent = rangeEndPercent - rangeStartPercent;

    // Determine color based on position relative to range
    let resultColor = "bg-gray-600"; // Default color if range is partial
    if (validMin && validMax) {
        resultColor = result >= minRange! && result <= maxRange! ? "bg-green-600" : "bg-red-600";
    } else if (validMin) {
        resultColor = result >= minRange! ? "bg-green-600" : "bg-red-600";
    } else if (validMax) {
        resultColor = result <= maxRange! ? "bg-green-600" : "bg-red-600";
    }


    return (
        <div className="w-full flex flex-col items-center my-1">
            {/* The Bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative my-1">
                {/* Green Zone (Normal Range) */}
                {rangeWidthPercent > 0 && (
                     <div
                        className="absolute h-full bg-green-200 dark:bg-green-800/50 rounded-full"
                        style={{
                            left: `${rangeStartPercent}%`,
                            width: `${rangeWidthPercent}%`,
                        }}
                    />
                )}
                {/* Result Indicator */}
                <div
                    className={cn("absolute top-[-2px] h-3 w-1 rounded-sm", resultColor)}
                    style={{ left: `calc(${resultPercent}% - 2px)` }} // Center the 1-width indicator
                    title={`Result: ${result} ${unit}`}
                />
            </div>
            {/* Labels - Responsive Layout */}
            <div className="w-full text-xs text-muted-foreground mt-1 px-1">
                {/* Horizontal Layout for sm screens and up */}
                <div className="hidden sm:flex justify-between relative items-center">
                    <span>{displayMin.toFixed(1)}</span>
                    {/* Wrapper for centered range label - Handles full and partial ranges */}
                    {(validMin || validMax) && (
                        <div
                            className="absolute text-center w-full"
                            style={{
                                left: `${rangeStartPercent}%`,
                                width: `${rangeWidthPercent}%`,
                                // Ensure visibility even if width is small
                                minWidth: 'fit-content', 
                                padding: '0 2px' // Add slight padding
                            }}
                        >
                            <span className="font-medium text-green-700 dark:text-green-400">
                                {/* Display >min, <max, or min-max */}
                                {validMin && validMax && rangeWidthPercent > 10 ? `${minRange!} - ${maxRange!}`
                                 : validMin && !validMax ? `> ${minRange!}`
                                 : !validMin && validMax ? `< ${maxRange!}`
                                 : '' /* Hide if too narrow and only one bound */ }
                            </span>
                        </div>
                    )}
                    <span className="text-right">{displayMax.toFixed(1)} {unit}</span>
                </div>

                {/* Stacked Layout for small screens (default) */}
                <div className="sm:hidden flex flex-col items-center">
                     {/* Display >min, <max, or min-max */}
                     {validMin && validMax && rangeWidthPercent > 10 ? (
                        <span className="font-medium text-green-700 dark:text-green-400 mb-0.5">
                             Range: {`${minRange!} - ${maxRange!}`}
                        </span>
                     ) : validMin && !validMax ? (
                        <span className="font-medium text-green-700 dark:text-green-400 mb-0.5">
                             Range: {`> ${minRange!}`}
                        </span>
                     ) : !validMin && validMax ? (
                         <span className="font-medium text-green-700 dark:text-green-400 mb-0.5">
                             Range: {`< ${maxRange!}`}
                        </span>
                     ) : null}
                    <div className="w-full flex justify-between mt-0.5">
                         <span>Min: {displayMin.toFixed(1)}</span>
                         <span className="text-right">Max: {displayMax.toFixed(1)} {unit}</span>
                    </div>
                </div>
            </div>
             {/* Show result value clearly if needed, especially if indicator is hard to pinpoint */}
             {/* <div className="text-xs font-semibold mt-1">{`Result: ${result} ${unit}`}</div> */}
        </div>
    );
};

export default RangeBar; 