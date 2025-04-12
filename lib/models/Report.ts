import { Schema, model, models } from "mongoose";

// Interface for individual file details within a report
interface IReportFile {
  filePath: string; // Key/path to the stored report file (e.g., S3 key)
  fileName: string; // Original name of the uploaded file
  fileType: string; // MIME type of the uploaded file
  fileSize: number; // Size of the file in bytes
}

// Interface defining the structure of a Report document
interface IReport {
  userId: string; // Reference to the Clerk User ID
  title?: string;
  files: IReportFile[]; // Array containing details of all associated files
  patientName?: string;
  patientSex?: string; // Added patient sex
  labName?: string;
  patientAge?: string; // Using string to accommodate formats like "35 years", "6 months"
  referringDoctor?: string;
  sampleDate?: Date;
  reportDate?: Date;
  labDirector?: string;
  labContact?: string;
  bloodTests: Record<string, unknown>; // Placeholder for structured test results
  processingStatus: "pending" | "processing" | "completed" | "failed"; // To track report data extraction status
  errorMessage?: string; // Store error message if processing failed
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
      type: Date,
      required: false,
    },
    reportDate: {
      type: Date,
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
    bloodTests: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    processingStatus: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    errorMessage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Report = models.Report || model<IReport>("Report", ReportSchema);

export default Report;
export type { IReport, IReportFile }; // Export the new interfaces
