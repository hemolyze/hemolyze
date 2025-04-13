import { Schema, model, models, Types } from "mongoose";
import { z } from "zod"; // Import Zod

// --- Zod Schemas for Blood Test Data Structure ---
// Moved here for better co-location with the main model

// Schema for a single test result
const TestResultSchema = z
  .object({
    _id: z.string().optional().describe("Unique identifier for the test result entry"),
    test: z
      .string()
      .describe("Name of the blood test (e.g., Hemoglobin (Hb), RBC Count)"),
    result: z
      .union([z.number(), z.string()])
      .describe(
        "The measured value of the test. Can be numeric or string (e.g., 'Not Detected')"
      ),
    unit: z
      .string()
      .optional()
      .describe("Unit of measurement (e.g., g/dL, %, *10^12/L)"),
    referenceRange: z
      .object({
        min: z
          .union([z.number(), z.string()])
          .optional()
          .describe("Lower bound of the normal range."),
        max: z
          .union([z.number(), z.string()])
          .optional()
          .describe("Upper bound of the normal range."),
        text: z
          .string()
          .optional()
          .describe(
            "Full reference range text if min/max cannot be extracted (e.g., '< 150')"
          ),
      })
      .optional()
      .describe("The normal reference range for the test."),
    interpretation: z
      .string()
      .optional()
      .describe(
        "Interpretation if provided (e.g., High, Low, Normal, Borderline)"
      ),
    // Add fields for the full visualization scale
    gaugeMin: z
      .number()
      .optional()
      .describe(
        "The absolute minimum value for the visualization gauge/scale start."
      ),
    gaugeMax: z
      .number()
      .optional()
      .describe(
        "The absolute maximum value for the visualization gauge/scale end."
      ),
    // Add field for optional educational information (flexible structure)
    educationalInfo: z
      .any()
      .optional()
      .describe(
        "Optional field to store structured educational information related to the test. Allows any data structure."
      ),
  })
  .describe(
    "Represents a single blood test result including visualization scale bounds and optional educational info"
  );

// Export the inferred type for a single test result
export type TestResult = z.infer<typeof TestResultSchema>;

// Schema for a group of tests within the 'table' section
const GroupedTableTestSchema = z
  .object({
    group: z
      .string()
      .describe("Name of the test panel or group (e.g., CBC, BMP, Lipids)"),
    tests: z
      .array(TestResultSchema)
      .describe("List of individual test results belonging to this group"),
  })
  .describe("Represents a group of related tests, often part of a panel");

// Main schema for the extracted blood test data
export const BloodTestsDataZodSchema = z
  .object({
    gauge: z
      .array(TestResultSchema)
      .describe(
        "List of key test results suitable for gauge visualization (e.g., Hemoglobin, Glucose, Cholesterol)"
      ),
    table: z
      .array(GroupedTableTestSchema)
      .describe(
        "List of test results grouped by panel/category, suitable for table visualization (e.g., CBC, Liver Panel)"
      ),
  })
  .describe(
    "Structured representation of blood test results extracted from the report(s)"
  );

// Type alias for the actual data structure stored/used
export type BloodTestsData = z.infer<typeof BloodTestsDataZodSchema>;

// Interface for individual file details within a report
interface IReportFile {
  filePath: string; // Key/path to the stored report file (e.g., S3 key)
  fileName: string; // Original name of the uploaded file
  fileType: string; // MIME type of the uploaded file
  fileSize: number; // Size of the file in bytes
}

// Define the possible statuses for each processing phase
type ProcessingPhaseStatus = "pending" | "processing" | "completed" | "failed";
// Define the possible overall statuses
type OverallStatus =
  | "pending"
  | "processing"
  | "partial"
  | "completed"
  | "failed";

// Interface defining the structure of a Report document
interface IReport {
  _id: Types.ObjectId; // Use Mongoose ObjectId type
  userId: string; // Reference to the Clerk User ID
  title?: string;
  files: IReportFile[]; // Array containing details of all associated files
  patientName?: string;
  patientSex?: string; // Added patient sex
  labName?: string;
  patientAge?: string; // Using string to accommodate formats like "35 years", "6 months"
  referringDoctor?: string;
  sampleDate?: string;
  reportDate?: string;
  labDirector?: string;
  labContact?: string;
  // bloodTests: Record<string, unknown>; // Replaced by testsData

  // New granular status tracking
  overallStatus: OverallStatus;
  metadataStatus: ProcessingPhaseStatus;
  testsStatus: ProcessingPhaseStatus;
  educationStatus: ProcessingPhaseStatus;

  // --- Specific Data Fields ---
  // Store the structured test results here
  testsData?: BloodTestsData | null; // Add the new field

  // Optional error messages per phase
  metadataError?: string;
  testsError?: string;
  educationError?: string;

  createdAt?: Date; // Handled by timestamps
  updatedAt?: Date; // Handled by timestamps
}

// Sub-schema for the file details
const ReportFileSchema = new Schema<IReportFile>(
  {
    filePath: {
      type: String,
      required: true,
      // Removed unique: true, uniqueness might be handled elsewhere or not required per file
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  },
  { _id: false } // Prevent Mongoose from creating an _id for each file subdocument
);

const ReportSchema = new Schema<IReport>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Index for faster querying by user
    },
    title: {
      type: String,
      required: false,
      default: "Untitled Report",
    },
    files: {
      type: [ReportFileSchema], // Use the sub-schema for an array of files
      required: true,
      validate: [
        (v: IReportFile[]) => Array.isArray(v) && v.length > 0,
        "At least one file must be provided",
      ],
    },
    patientName: {
      type: String,
      required: false,
    },
    patientSex: {
      // Added patientSex field
      type: String,
      required: false,
      // enum: ['Male', 'Female', 'Other', 'Undisclosed'] // Optional: Add enum if specific values are required
    },
    labName: {
      type: String,
      required: false,
    },
    patientAge: {
      type: String,
      required: false,
    },
    referringDoctor: {
      type: String,
      required: false,
    },
    sampleDate: {
      type: String,
      required: false,
    },
    reportDate: {
      type: String,
      required: false,
    },
    labDirector: {
      type: String,
      required: false,
    },
    labContact: {
      type: String,
      required: false,
    },
    // bloodTests: { // Replaced by testsData
    //   type: Schema.Types.Mixed,
    //   required: true,
    //   default: {},
    // },
    // --- New Status Fields ---
    overallStatus: {
      type: String,
      required: true,
      enum: ["pending", "processing", "partial", "completed", "failed"],
      default: "pending",
      index: true,
    },
    metadataStatus: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    testsStatus: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    educationStatus: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    // --- Specific Data Fields ---
    testsData: {
      type: Schema.Types.Mixed, // Using Mixed for flexibility with the nested structure
      required: false,
      default: null,
    },
    // --- Error Fields ---
    metadataError: { type: String, required: false },
    testsError: { type: String, required: false },
    educationError: { type: String, required: false },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Report = models.Report || model<IReport>("Report", ReportSchema);

export default Report;
// Export the type alias for testsData structure
export type { IReport, IReportFile, ProcessingPhaseStatus, OverallStatus };
