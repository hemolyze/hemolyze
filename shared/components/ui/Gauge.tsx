"use client";

import React, { // Import React namespace for types like React.FC, React.ChangeEvent etc.
    useState,
    useMemo,
    useCallback,
    CSSProperties, // Import CSSProperties for inline styles
    JSX
} from "react";
// import { useTheme } from "@/shared/context/ThemeContext"; // Removed as it wasn't used
// Remove PropTypes import, it's no longer needed
// import PropTypes from "prop-types";
// import "./Gauge.css"; // Import the CSS file
// import { getLabel } from "@/shared/lib/patient-education-helpers"; // Import from new location

// --- Type Definitions ---

interface Point {
    x: number;
    y: number;
}

// Define the keys expected in patientEducation
type PatientEducationKey =
    | "testMeaning"
    | "interpretation"
    | "potentialSymptoms"
    | "normalizationTips"
    | "importantNote";

// Define the structure for patient education data
type PatientEducationData = Partial<Record<PatientEducationKey, string>>;

// Define the shape of the options object users can pass in
// All properties are optional because defaults are provided
interface GaugeUserOptions {
    title?: string;
    unit?: string;
    minValue?: number;
    maxValue?: number;
    lowThreshold?: number;
    highThreshold?: number;
    initialValue?: number;
    lowRangeLabel?: string;
    normalRangeLabel?: string;
    highRangeLabel?: string;
    valuePrecision?: number;
    lowColor?: string; // Could use template literal types for hex colors if stricter typing is needed
    normalColor?: string;
    highColor?: string;
    labelFontSize?: number;
    patientEducation?: PatientEducationData; // Use the specific type here
}

// Define the actual options structure used internally after merging defaults
// All properties are required here
interface GaugeOptions {
    title: string;
    unit: string;
    minValue: number;
    maxValue: number;
    lowThreshold: number;
    highThreshold: number;
    initialValue: number;
    lowRangeLabel: string;
    normalRangeLabel: string;
    highRangeLabel: string;
    valuePrecision: number;
    lowColor: string;
    normalColor: string;
    highColor: string;
    labelFontSize: number;
}

// Define the props for the Gauge component
interface GaugeProps {
    options?: GaugeUserOptions; // User options are optional and partial
    infoDialog?: React.ReactNode;
}

// Structure for calculated arc path data
interface ArcData {
    lowD: string;
    normalD: string;
    highD: string;
    capStartD: string;
    capEndD: string;
}

// Structure for calculated label positions
interface LabelPositions {
    thresholdLowPos: Point;
    thresholdHighPos: Point;
    rangeLowPos: Point;
    rangeNormalPos: Point;
    rangeHighPos: Point;
}

// --- Helper Functions (Typed) ---
const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number): Point => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians),
    };
};

const describeArc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number): string => {
    // Ensure end angle is slightly different from start if they are too close
    if (Math.abs(startDeg - endDeg) < 0.01) {
        return ""; // Return empty path for zero-length arcs
    }

    const start = polarToCartesian(cx, cy, r, endDeg);
    const end = polarToCartesian(cx, cy, r, startDeg);
    const largeArcFlag = Math.abs(endDeg - startDeg) <= 180 ? "0" : "1";
    const sweepFlag = "0"; // Counter-clockwise

    // Use template literal for clarity
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
};

// --- Gauge Component (Typed) ---
// Use React.FC<GaugeProps> or the function signature style below
function Gauge({ options: userOptions = {}, infoDialog }: GaugeProps): JSX.Element { // Explicit return type JSX.Element
    // const { effectiveTheme } = useTheme(); // Removed as it wasn't used directly in this component

    console.log('userOptions', userOptions)
    // --- Constants (Internal configuration) ---
    // These could be derived from props if needed, but are fixed here
    const centerX: number = 200;
    const centerY: number = 200;
    const radius: number = 150;
    const arcStrokeWidth: number = 30; // Used conceptually, not directly typed here but influences offsets
    const startAngle: number = -90;
    const endAngle: number = 90;
    const totalAngleRange: number = endAngle - startAngle;
    const thresholdLabelRadiusOffset: number = arcStrokeWidth / 2 + 15;
    const rangeLabelRadiusOffset: number = arcStrokeWidth / 2 + 25;

    // --- Default Options (Typed) ---
    const defaultOptions: GaugeOptions = {
        title: "Gauge",
        unit: "",
        minValue: 0,
        maxValue: 100,
        lowThreshold: 30,
        highThreshold: 70,
        initialValue: 50,
        lowRangeLabel: "Low",
        normalRangeLabel: "Normal",
        highRangeLabel: "High",
        valuePrecision: 1,
        lowColor: "#4cb860",
        normalColor: "#faa419",
        highColor: "#ff144b",
        labelFontSize: 13,
    };

    // --- Merge Options (Typed) ---
    // The merged options will always satisfy the full GaugeOptions interface
    const options: GaugeOptions = useMemo(
        () => ({ ...defaultOptions, ...userOptions }),
        [userOptions] // defaultOptions is stable, no need to list as dep usually
    );

    // --- State (Typed) ---
    const [currentValue, setCurrentValue] = useState<number>(options.initialValue);
    console.log('currentValue', setCurrentValue)

    // --- Derived Calculations (Memoized and Typed) ---

    // Calculate angle for a given value
    const valueToAngle = useCallback(
        (value: number): number => {
            const clampedValue = Math.max(
                options.minValue,
                Math.min(options.maxValue, value)
            );
            const range = options.maxValue - options.minValue;
            if (range === 0) return startAngle;
            const percentage = (clampedValue - options.minValue) / range;
            return startAngle + percentage * totalAngleRange;
        },
        [options.minValue, options.maxValue, startAngle, totalAngleRange] // Add stable dependencies
    );

    // Get status label based on value
    const getStatus = useCallback(
        (value: number): string => {
            if (value < options.lowThreshold) return options.lowRangeLabel;
            if (value <= options.highThreshold) return options.normalRangeLabel;
            return options.highRangeLabel;
        },
        [
            options.lowThreshold,
            options.highThreshold,
            options.lowRangeLabel,
            options.normalRangeLabel,
            options.highRangeLabel,
        ]
    );

    // Calculate needle angle and status string
    const needleAngle: number = useMemo(
        () => valueToAngle(currentValue),
        [currentValue, valueToAngle]
    );
    const status: string = useMemo(
        () => getStatus(currentValue),
        [currentValue, getStatus]
    );

    // Calculate arc path data ('d' attributes)
    const arcData: ArcData = useMemo(() => {
        const lowAngleEnd = valueToAngle(options.lowThreshold);
        const normalAngleEnd = valueToAngle(options.highThreshold);
        const epsilon = 0.1; // For caps

        return {
            lowD: describeArc(centerX, centerY, radius, startAngle, lowAngleEnd),
            normalD: describeArc(
                centerX,
                centerY,
                radius,
                lowAngleEnd,
                normalAngleEnd
            ),
            highD: describeArc(centerX, centerY, radius, normalAngleEnd, endAngle),
            capStartD: describeArc(
                centerX,
                centerY,
                radius,
                startAngle,
                startAngle + epsilon
            ),
            capEndD: describeArc(
                centerX,
                centerY,
                radius,
                endAngle - epsilon,
                endAngle
            ),
        };
    }, [options.lowThreshold, options.highThreshold, valueToAngle, startAngle, endAngle, centerX, centerY, radius]); // Added dependencies

    // Calculate label positions
    const labelPositions: LabelPositions = useMemo(() => {
        const thresholdLabelRadius = radius - thresholdLabelRadiusOffset;
        const rangeLabelRadius = radius - rangeLabelRadiusOffset;

        const lowThresholdAngle = valueToAngle(options.lowThreshold);
        const highThresholdAngle = valueToAngle(options.highThreshold);

        // Midpoint angles for range labels
        const lowMidAngle = startAngle + (lowThresholdAngle - startAngle) / 2;
        const normalMidAngle =
            lowThresholdAngle + (highThresholdAngle - lowThresholdAngle) / 2;
        const highMidAngle =
            highThresholdAngle + (endAngle - highThresholdAngle) / 2;

        return {
            thresholdLowPos: polarToCartesian(
                centerX,
                centerY,
                thresholdLabelRadius,
                lowThresholdAngle
            ),
            thresholdHighPos: polarToCartesian(
                centerX,
                centerY,
                thresholdLabelRadius,
                highThresholdAngle
            ),
            rangeLowPos: polarToCartesian(
                centerX,
                centerY,
                rangeLabelRadius,
                lowMidAngle
            ),
            rangeNormalPos: polarToCartesian(
                centerX,
                centerY,
                rangeLabelRadius,
                normalMidAngle
            ),
            rangeHighPos: polarToCartesian(
                centerX,
                centerY,
                rangeLabelRadius,
                highMidAngle
            ),
        };
    }, [options.lowThreshold, options.highThreshold, valueToAngle, radius, thresholdLabelRadiusOffset, rangeLabelRadiusOffset, startAngle, endAngle, centerX, centerY]); // Added dependencies

    // Determine status background class (Typed) - Added Dark Mode
    const statusBgClass: string = useMemo(() => {
        if (status === options.lowRangeLabel || status === options.highRangeLabel) {
            return "bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/40 dark:border-red-700/60 dark:text-red-200";
        }
        return "bg-green-100 border border-green-300 text-green-700 dark:bg-green-900/40 dark:border-green-700/60 dark:text-green-200";
    }, [status, options.lowRangeLabel, options.highRangeLabel]); // Dependencies

    const valueDisplay: string = isNaN(currentValue)
        ? "--"
        : currentValue.toFixed(options.valuePrecision);

    // Use CSSProperties for inline styles
    const textStyle: CSSProperties = { fontSize: `${options.labelFontSize}px` };
    const rangeLabelStyle: CSSProperties = { fontSize: `${options.labelFontSize + 2}px` };
    const needleStyle: CSSProperties = {
        transform: `rotate(${needleAngle}deg)`,
        transition: 'transform 0.5s ease-out'
    };
    const lowArcStyle: CSSProperties = { stroke: options.lowColor };
    const normalArcStyle: CSSProperties = { stroke: options.normalColor };
    const highArcStyle: CSSProperties = { stroke: options.highColor };
    const capStartStyle: CSSProperties = { stroke: options.lowColor };
    const capEndStyle: CSSProperties = { stroke: options.highColor };

    // --- Render JSX ---
    return (
        // Apply dark mode styles to the main container
        <div className="gauge-meter-container relative border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-none rounded-lg p-6 bg-white dark:bg-gray-800">
            {/* Apply dark mode text color */}
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 text-center">
                {options.title} {options.unit ? `(${options.unit})` : ""}
            </h1>

            {/* DO NOT CHANGE SVG, AND RELATED CODE. INSIDE THIS BLOCK */}
            <svg
                className="gauge-svg-container w-full h-auto"
                width="100%"
                height="100%"
                viewBox="0 0 400 280"
                preserveAspectRatio="xMidYMid meet"
                // Add accessibility attributes
                role="meter"
                aria-valuemin={options.minValue}
                aria-valuemax={options.maxValue}
                aria-valuenow={currentValue}
                aria-valuetext={`${valueDisplay} ${options.unit}, Status: ${status}`}
                aria-label={`${options.title} Gauge`}
            >
                {/* Use theme-dependent title */}
                <title className="fill-current text-gray-900 dark:text-gray-100">{`${options.title}: ${valueDisplay} ${options.unit} (${status})`}</title>
                {/* Arcs */}
                <path
                    className="gauge-arc gauge-arc-low"
                    d={arcData.lowD}
                    style={lowArcStyle}
                    strokeWidth={arcStrokeWidth} // Apply strokeWidth directly
                    fill="none"
                />
                <path
                    className="gauge-arc gauge-arc-normal"
                    d={arcData.normalD}
                    style={normalArcStyle}
                    strokeWidth={arcStrokeWidth}
                    fill="none"
                />
                <path
                    className="gauge-arc gauge-arc-high"
                    d={arcData.highD}
                    style={highArcStyle}
                    strokeWidth={arcStrokeWidth}
                    fill="none"
                />

                {/* Caps */}
                <path
                    className="gauge-arc-cap"
                    d={arcData.capStartD}
                    style={capStartStyle}
                    strokeWidth={arcStrokeWidth}
                    fill="none"
                    strokeLinecap="round" // Use round caps for better appearance
                />
                <path
                    className="gauge-arc-cap"
                    d={arcData.capEndD}
                    style={capEndStyle}
                    strokeWidth={arcStrokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Threshold indicators - small triangles with dark mode */}
                <polygon 
                    points={`${labelPositions.thresholdLowPos.x-8},${labelPositions.thresholdLowPos.y+15} ${labelPositions.thresholdLowPos.x},${labelPositions.thresholdLowPos.y} ${labelPositions.thresholdLowPos.x+8},${labelPositions.thresholdLowPos.y+15}`} 
                    className="fill-slate-400 dark:fill-slate-500 opacity-80" // Use Tailwind
                />
                <polygon 
                    points={`${labelPositions.thresholdHighPos.x-8},${labelPositions.thresholdHighPos.y+15} ${labelPositions.thresholdHighPos.x},${labelPositions.thresholdHighPos.y} ${labelPositions.thresholdHighPos.x+8},${labelPositions.thresholdHighPos.y+15}`} 
                    className="fill-slate-400 dark:fill-slate-500 opacity-80" // Use Tailwind
                />

                {/* Needle with refined styling & dark mode */}
                <g className="gauge-needle-group" style={needleStyle} transform-origin={`${centerX} ${centerY}`}>
                    {/* Needle shadow - subtle adjustments maybe needed */}
                    <line
                        x1={centerX}
                        y1={centerY + 5}
                        x2={centerX}
                        y2={centerY - radius + (arcStrokeWidth / 2) + 15}
                        strokeWidth="3"
                        strokeLinecap="round"
                        transform="translate(1, 1)"
                        className="stroke-black/10 dark:stroke-black/20" // Adjusted shadow
                    />
                    {/* Needle */} 
                    <line
                        className="gauge-needle text-slate-600 dark:text-slate-300" // Combined classes
                        x1={centerX}
                        y1={centerY + 5}
                        x2={centerX}
                        y2={centerY - radius + (arcStrokeWidth / 2) + 15}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        stroke="currentColor" // Inherit text color
                    />
                    {/* Needle base - Use Tailwind for colors */}
                    <circle
                        className="gauge-needle-base text-slate-100 stroke-slate-600 dark:text-gray-700 dark:stroke-gray-300" // Combined classes
                        cx={centerX}
                        cy={centerY}
                        r="12"
                        strokeWidth="2"
                        fill="currentColor"
                        stroke="currentColor"
                    />
                    <circle
                        className="text-slate-400 dark:text-slate-500" // Class for inner circle
                        cx={centerX}
                        cy={centerY}
                        r="6"
                        fill="currentColor"
                    />
                </g>

                {/* Labels */}
                {/* Min/Max Values */}
                <text
                    className="gauge-label gauge-label-value fill-slate-500 dark:fill-slate-400"
                    x={centerX - radius - 10}
                    y={centerY + 35}
                    textAnchor="middle"
                    style={textStyle}
                    fontWeight="500"
                >
                    {options.minValue} {options.unit}
                </text>
                <text
                    className="gauge-label gauge-label-value fill-slate-500 dark:fill-slate-400"
                    x={centerX + radius + 10}
                    y={centerY + 35}
                    textAnchor="middle"
                    style={textStyle}
                    fontWeight="500"
                >
                    {options.maxValue} {options.unit}
                </text>

                {/* Threshold Values */}
                <text
                    className="gauge-label gauge-label-threshold fill-slate-500 dark:fill-slate-400"
                    x={labelPositions.thresholdLowPos.x}
                    y={labelPositions.thresholdLowPos.y + 35}
                    textAnchor="middle"
                    dy="0.3em"
                    style={textStyle}
                    fontWeight="500"
                >
                    {options.lowThreshold} {/* Removed unit for less clutter */}
                </text>
                <text
                    className="gauge-label gauge-label-threshold fill-slate-500 dark:fill-slate-400"
                    x={labelPositions.thresholdHighPos.x}
                    y={labelPositions.thresholdHighPos.y + 35}
                    textAnchor="middle"
                    dy="0.3em"
                    style={textStyle}
                    fontWeight="500"
                >
                    {options.highThreshold} {/* Removed unit */}
                </text>

                {/* Range Labels */}
                <text
                    className="gauge-label gauge-label-range fill-slate-500 dark:fill-slate-400"
                    x={labelPositions.rangeLowPos.x}
                    y={labelPositions.rangeLowPos.y - 20}
                    textAnchor="middle"
                    dy="0.3em"
                    style={rangeLabelStyle}
                    fontWeight="600"
                >
                    {options.lowRangeLabel}
                </text>
                <text
                    className="gauge-label gauge-label-range fill-slate-500 dark:fill-slate-400"
                    x={labelPositions.rangeNormalPos.x}
                    y={labelPositions.rangeNormalPos.y - 25}
                    textAnchor="middle"
                    dy="0.3em"
                    style={rangeLabelStyle}
                    fontWeight="600"
                >
                    {options.normalRangeLabel}
                </text>
                <text
                    className="gauge-label gauge-label-range fill-slate-500 dark:fill-slate-400"
                    x={labelPositions.rangeHighPos.x}
                    y={labelPositions.rangeHighPos.y - 20}
                    textAnchor="middle"
                    dy="0.3em"
                    style={rangeLabelStyle}
                    fontWeight="600"
                >
                    {options.highRangeLabel}
                </text>

                {/* Current Value Label with dark mode */}
                <text
                    className="gauge-label gauge-label-current fill-slate-800 dark:fill-slate-100"
                    x={centerX}
                    y={centerY + radius * 0.4 + 10}
                    textAnchor="middle"
                    fontSize="26"
                    fontWeight="700"
                >
                    {valueDisplay} {options.unit}
                </text>
            </svg>
            {/* DO NOT CHANGE SVG, AND RELATED CODE. INSIDE THIS BLOCK */}

            {/* Status Badge with dark mode styling applied via statusBgClass */}
            <div className="flex justify-center mt-4">
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${statusBgClass} shadow-sm`}>
                    {status}
                </span>
            </div>

            {/* Learn More Button */}
            <div className="mt-4 text-center"> {/* Container for centering */}
                {infoDialog}
            </div>
        </div>
    );
}

// --- Remove PropTypes ---
// Gauge.propTypes = { ... }; // This block is no longer needed
export default Gauge;