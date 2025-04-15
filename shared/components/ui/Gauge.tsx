"use client";

import React, { // Import React namespace for types like React.FC, React.ChangeEvent etc.
    useState,
    useMemo,
    useCallback,
    CSSProperties, // Import CSSProperties for inline styles
    JSX
} from "react";
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
        lowColor: "#D9534F",
        normalColor: "#5CB85C",
        highColor: "#D9534F",
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

    // Determine status background class (Typed)
    const statusBgClass: string = useMemo(() => {
        // Use Tailwind classes. Ensure these colors are available.
        if (status === options.lowRangeLabel) return "bg-red-500"; // Low status - Red
        if (status === options.highRangeLabel) return "bg-red-500"; // High status - Also Red (typically abnormal)
        return "bg-green-500"; // Normal status - Green
    }, [status, options.lowRangeLabel, options.highRangeLabel]); // Dependencies

    const valueDisplay: string = isNaN(currentValue)
        ? "--"
        : currentValue.toFixed(options.valuePrecision);

    // Use CSSProperties for inline styles
    const textStyle: CSSProperties = { fontSize: `${options.labelFontSize}px` };
    const rangeLabelStyle: CSSProperties = { fontSize: `${options.labelFontSize + 2}px` };
    const lowArcStyle: CSSProperties = { stroke: options.lowColor };
    const normalArcStyle: CSSProperties = { stroke: options.normalColor };
    const highArcStyle: CSSProperties = { stroke: options.highColor };
    const capStartStyle: CSSProperties = { stroke: options.lowColor };
    const capEndStyle: CSSProperties = { stroke: options.highColor };
    const needleStyle: CSSProperties = { transform: `rotate(${needleAngle}deg)` };

    // --- Render JSX ---
    return (
        <div className="gauge-meter-container relative border shadow-md rounded-md p-4">
            <h1 className="text-lg font-semibold text-gray-700 mb-2">
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
                <title>{`${options.title}: ${valueDisplay} ${options.unit} (${status})`}</title>
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

                {/* Threshold indicators - small triangles */}
                <polygon 
                    points={`${labelPositions.thresholdLowPos.x-8},${labelPositions.thresholdLowPos.y+15} ${labelPositions.thresholdLowPos.x},${labelPositions.thresholdLowPos.y} ${labelPositions.thresholdLowPos.x+8},${labelPositions.thresholdLowPos.y+15}`} 
                    fill="#64748b" 
                    opacity="0.6"
                />
                <polygon 
                    points={`${labelPositions.thresholdHighPos.x-8},${labelPositions.thresholdHighPos.y+15} ${labelPositions.thresholdHighPos.x},${labelPositions.thresholdHighPos.y} ${labelPositions.thresholdHighPos.x+8},${labelPositions.thresholdHighPos.y+15}`} 
                    fill="#64748b" 
                    opacity="0.6"
                />

                {/* Needle with refined styling */}
                <g className="gauge-needle-group" style={needleStyle} transform-origin={`${centerX} ${centerY}`}>
                    {/* Needle shadow */}
                    <line
                        x1={centerX}
                        y1={centerY + 5}
                        x2={centerX}
                        y2={centerY - radius + (arcStrokeWidth / 2) + 15}
                        stroke="rgba(0,0,0,0.15)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        transform="translate(1, 1)"
                    />
                    {/* Needle */}
                    <line
                        className="gauge-needle"
                        x1={centerX}
                        y1={centerY}
                        x2={centerX}
                        y2={centerY - radius + (arcStrokeWidth / 2) + 5} // Adjust length to fit inside arc
                        stroke="black" // Define needle appearance
                        strokeWidth="3"
                    // No inline style needed here as rotation is on the group
                    />
                    <circle
                        className="gauge-needle-base"
                        cx={centerX}
                        cy={centerY}
                        r="10"
                        fill="black" // Define base appearance
                    />
                </g>

                {/* Labels */}
                {/* Min/Max Values */}
                <text
                    className="gauge-label gauge-label-value"
                    x={centerX - radius - 5} // Adjust position based on radius
                    y={centerY + 25} // Adjust vertical position
                    textAnchor="middle" // Usually better for programmatic placement
                    style={textStyle}
                >
                    {options.minValue} {options.unit}
                </text>
                <text
                    className="gauge-label gauge-label-value"
                    x={centerX + radius + 5} // Adjust position
                    y={centerY + 25} // Adjust vertical position
                    textAnchor="middle"
                    style={textStyle}
                >
                    {options.maxValue} {options.unit}
                </text>

                {/* Threshold Values */}
                <text
                    className="gauge-label gauge-label-threshold"
                    x={labelPositions.thresholdLowPos.x}
                    y={labelPositions.thresholdLowPos.y + 35}
                    textAnchor="middle"
                    dy="0.3em"
                    style={textStyle}
                >
                    {options.lowThreshold} {/* Removed unit for less clutter */}
                </text>
                <text
                    className="gauge-label gauge-label-threshold"
                    x={labelPositions.thresholdHighPos.x}
                    y={labelPositions.thresholdHighPos.y + 35}
                    textAnchor="middle"
                    dy="0.3em"
                    style={textStyle}
                >
                    {options.highThreshold} {/* Removed unit */}
                </text>

                {/* Range Labels */}
                <text
                    className="gauge-label gauge-label-range"
                    x={labelPositions.rangeLowPos.x}
                    y={labelPositions.rangeLowPos.y - 20}
                    textAnchor="middle"
                    dy="0.3em"
                    style={rangeLabelStyle}
                >
                    {options.lowRangeLabel}
                </text>
                <text
                    className="gauge-label gauge-label-range"
                    x={labelPositions.rangeNormalPos.x}
                    y={labelPositions.rangeNormalPos.y - 25}
                    textAnchor="middle"
                    dy="0.3em"
                    style={rangeLabelStyle}
                >
                    {options.normalRangeLabel}
                </text>
                <text
                    className="gauge-label gauge-label-range"
                    x={labelPositions.rangeHighPos.x}
                    y={labelPositions.rangeHighPos.y - 20}
                    textAnchor="middle"
                    dy="0.3em"
                    style={rangeLabelStyle}
                >
                    {options.highRangeLabel}
                </text>

                {/* Current Value Label */}
                <text
                    className="gauge-label gauge-label-current"
                    x={centerX}
                    y={centerY + radius * 0.4} // Position below center
                    textAnchor="middle"
                    fontSize="24" // Make current value prominent
                    fontWeight="bold"
                    fill="#333"
                >
                    {valueDisplay} {options.unit}
                </text>
            </svg>
            {/* DO NOT CHANGE SVG, AND RELATED CODE. INSIDE THIS BLOCK */}

            {/* Status Badge */}
            <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-semibold mt-2 ${statusBgClass}`}>
                {status}
            </span>

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