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
import "./Gauge.css"; // Import the CSS file
import { Dialog, DialogContent, DialogTrigger } from "@/shared/components/ui/dialog";
import { Button } from '@/shared/components/ui/button'
import { Info } from "lucide-react";
import { getLabel } from "@/shared/lib/patient-education-helpers"; // Import from new location

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
function Gauge({ options: userOptions = {} }: GaugeProps): JSX.Element { // Explicit return type JSX.Element
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

    // --- Event Handlers (Typed) ---
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseFloat(event.target.value);
        if (isNaN(val)) {
            // Decide handling for NaN, setting to minValue is one option
            val = options.minValue;
        }
        // Clamp value immediately
        const clampedVal = Math.max(
            options.minValue,
            Math.min(options.maxValue, val)
        );
        setCurrentValue(clampedVal);
    };

    // Type the element lookup result
    const handleUpdateClick = () => {
        const inputElement = document.getElementById(stableInputId) as HTMLInputElement | null; // Type cast
        if (inputElement) {
            const val = parseFloat(inputElement.value);
            if (!isNaN(val)) {
                const clampedVal = Math.max(
                    options.minValue,
                    Math.min(options.maxValue, val)
                );
                setCurrentValue(clampedVal);
            }
        }
    };

    const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            // Optional: handleUpdateClick(); // Or rely on state being set by onChange
        }
    };

    // Determine status text color (Typed)
    const statusColor: string = useMemo(() => {
        if (status === options.lowRangeLabel) return options.lowColor;
        if (status === options.highRangeLabel) return options.highColor;
        return options.normalColor;
    }, [status, options.lowRangeLabel, options.highRangeLabel, options.lowColor, options.normalColor, options.highColor]); // Added dependencies

    const valueDisplay: string = isNaN(currentValue)
        ? "--"
        : currentValue.toFixed(options.valuePrecision);

    // Use a stable ID derived from options
    const stableInputId: string = `gaugeValue-${options.title.replace(/\s+/g, "-")}`;

    // Use CSSProperties for inline styles
    const textStyle: CSSProperties = { fontSize: `${options.labelFontSize}px` };
    const rangeLabelStyle: CSSProperties = { fontSize: `${options.labelFontSize + 2}px` };
    const statusTextStyle: CSSProperties = { color: statusColor };
    const lowArcStyle: CSSProperties = { stroke: options.lowColor };
    const normalArcStyle: CSSProperties = { stroke: options.normalColor };
    const highArcStyle: CSSProperties = { stroke: options.highColor };
    const capStartStyle: CSSProperties = { stroke: options.lowColor };
    const capEndStyle: CSSProperties = { stroke: options.highColor };
    const needleStyle: CSSProperties = { transform: `rotate(${needleAngle}deg)` };

    // --- Render JSX ---
    return (
        <div className="gauge-meter-container relative">
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="icon" className="cursor-pointer absolute top-0 right-0 m-4">
                        <Info />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    {
                        // Use nullish coalescing for safety and type inference
                        Object.entries(userOptions.patientEducation ?? {}).map(([key, value]) => (
                            <div key={key}>
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                    {/* Removed 'as string' cast, key is inferred as string */}
                                    {getLabel(key)}
                                </div>
                                <div className="text-sm text-gray-800 leading-normal"> {/* Darker text for value */}
                                    {value}
                                </div>
                                {/* <strong className="text-xs">{getLabel(key)}:</strong> <br /> {value} */}
                            </div>
                        ))
                    }
                </DialogContent>
            </Dialog>
            <h1>
                {options.title} {options.unit ? `(${options.unit})` : ""}
            </h1>

            <svg
                className="gauge-svg-container"
                width="400"
                height="280"
                viewBox="0 0 400 280"
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

                {/* Needle group for easier rotation */}
                {/* @ts-expect-error - Ignore the error for now */}
                <g className="gauge-needle-group" style={needleStyle} transformOrigin={`${centerX} ${centerY}`}>
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
                    y={labelPositions.thresholdLowPos.y}
                    textAnchor="middle" // Adjust anchor based on position
                    dy="0.3em" // Vertical alignment tweak
                    style={textStyle}
                >
                    {options.lowThreshold} {/* Removed unit for less clutter */}
                </text>
                <text
                    className="gauge-label gauge-label-threshold"
                    x={labelPositions.thresholdHighPos.x}
                    y={labelPositions.thresholdHighPos.y}
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
                    y={labelPositions.rangeLowPos.y}
                    textAnchor="middle"
                    dy="0.3em"
                    style={rangeLabelStyle}
                >
                    {options.lowRangeLabel}
                </text>
                <text
                    className="gauge-label gauge-label-range"
                    x={labelPositions.rangeNormalPos.x}
                    y={labelPositions.rangeNormalPos.y}
                    textAnchor="middle"
                    dy="0.3em"
                    style={rangeLabelStyle}
                >
                    {options.normalRangeLabel}
                </text>
                <text
                    className="gauge-label gauge-label-range"
                    x={labelPositions.rangeHighPos.x}
                    y={labelPositions.rangeHighPos.y}
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

            {/* Consider removing or hiding controls if interaction is purely external */}
            <div className="gauge-controls !hidden"> {/* Kept hidden as per original */}
                <label htmlFor={stableInputId}>
                    Enter Value ({options.minValue}-{options.maxValue}):
                </label>
                <input
                    type="number"
                    id={stableInputId}
                    min={options.minValue}
                    max={options.maxValue}
                    step={1 / Math.pow(10, options.valuePrecision)}
                    value={isNaN(currentValue) ? '' : currentValue} // Display empty string for NaN if input allows
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyPress} // Changed from onKeyPress for better Enter key handling
                />
                <button type="button" onClick={handleUpdateClick}>Update Meter</button>
            </div>
            <p className="gauge-status-text" style={statusTextStyle}>
                Status: {status}
            </p>
        </div>
    );
}

// --- Remove PropTypes ---
// Gauge.propTypes = { ... }; // This block is no longer needed

export default Gauge;