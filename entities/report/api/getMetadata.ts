import { connect } from "@/lib/db";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { generateObject, LanguageModel } from "ai";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import Report, {
  IReportFile,
  IReport,
  OverallStatus,
  ProcessingPhaseStatus,
} from "@/lib/models/Report"; // Ensure this path is correct

export type ReportMetadata = IReport;

type AiContentPart =
  | { type: "text"; text: string }
  | { type: "file"; data: Buffer; mimeType: string };

export async function getReportMetadata(
  id: string
): Promise<ReportMetadata | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log(`Invalid report ID format: ${id}`);
    notFound();
  }

  await connect();

  // Fetch the initial report state
  const initialReport = await Report.findById(id).lean<IReport>();

  if (!initialReport) {
    console.log(`Report not found for ID: ${id}`);
    notFound(); // Exit if report not found initially
  }

  // Check if metadata processing is needed
  if (
    initialReport.metadataStatus === "pending" ||
    initialReport.metadataStatus === "failed"
  ) {
    console.log(
      `Report ${id} metadata status is ${initialReport.metadataStatus}. Triggering processing.`
    );
    // Process metadata and return the final state from the DB (or null on error)
    return await processReportMetadata(initialReport);
  }

  // If no processing was needed, return the initially fetched report
  return initialReport;
}

const S3_BUCKET_NAME = process.env.X_AWS_BUCKET_NAME;

interface ReportFileWithUrl extends IReportFile {
  signedUrl: string;
}

let s3ClientInstance: S3Client | null = null;
let aiModelInstance: LanguageModel | null = null;

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    if (
      !process.env.X_AWS_REGION ||
      !process.env.X_AWS_ACCESS_KEY_ID ||
      !process.env.X_AWS_SECRET_ACCESS_KEY
    ) {
      throw new Error(
        "Missing required AWS environment variables for S3 client."
      );
    }
    s3ClientInstance = new S3Client({
      region: process.env.X_AWS_REGION!,
      credentials: {
        accessKeyId: process.env.X_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.X_AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3ClientInstance;
}

async function generateSignedUrlsForProcessing(
  files: IReportFile[]
): Promise<ReportFileWithUrl[]> {
  if (!S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set.");
  }
  const s3 = getS3Client();
  return Promise.all(
    files.map(async (file) => {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: file.filePath,
      });
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return {
        fileName: file.fileName,
        filePath: file.filePath,
        fileType: file.fileType,
        fileSize: file.fileSize,
        signedUrl: signedUrl,
      };
    })
  );
}

interface FetchedFileData {
  fileName: string;
  fileType: string;
  fileBuffer: Buffer;
  error?: string;
}

function getAiModel(): LanguageModel {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }
  if (!aiModelInstance) {
    // Initialize the specific model you want to use
    aiModelInstance = anthropic("claude-3-5-sonnet-latest");
  }
  return aiModelInstance;
}

async function fetchFileContentsForProcessing(
  filesWithUrls: ReportFileWithUrl[]
): Promise<FetchedFileData[]> {
  return Promise.all(
    filesWithUrls.map(async (file) => {
      try {
        const response = await fetch(file.signedUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${file.fileName} from S3: ${response.statusText}`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        return {
          fileName: file.fileName,
          fileType: file.fileType,
          fileBuffer: Buffer.from(arrayBuffer),
        };
      } catch (err) {
        console.error(`Error fetching file ${file.fileName}:`, err);
        return {
          fileName: file.fileName,
          fileType: file.fileType,
          fileBuffer: Buffer.alloc(0),
          error: err instanceof Error ? err.message : "Unknown fetch error",
        };
      }
    })
  );
}

const medicalReportSchema = z
  .object({
    title: z
      .string()
      .describe(
        "The title of the report, generate based on the report content"
      ),
    patientName: z
      .string()
      .default("not found")
      .describe("The patient's full name. Default to 'not found' if missing."),
    patientSex: z
      .string()
      .default("not found")
      .describe(
        "The patient's sex (e.g., Male, Female). Default to 'not found' if missing."
      ),
    patientAge: z
      .string()
      .default("not found")
      .describe(
        "The patient's age (e.g., 35 years, 6 months). Default to 'not found' if missing."
      ),
    labName: z
      .string()
      .default("not found")
      .describe(
        "The name of the laboratory. Default to 'not found' if missing."
      ),
    referringDoctor: z
      .string()
      .default("not found")
      .describe(
        "The name of the referring doctor. Default to 'not found' if missing."
      ),
    sampleDate: z
      .string()
      .describe(
        "The date the sample was collected, as a string. If not found, return 'not found'."
      ),
    reportDate: z
      .string()
      .describe(
        "The date the report was issued, as a string. If not found, return 'not found'."
      ),
    labDirector: z
      .string()
      .default("not found")
      .describe(
        "The name of the lab director. Default to 'not found' if missing."
      ),
    labContact: z
      .string()
      .default("not found")
      .describe(
        "Contact information for the lab. Default to 'not found' if missing."
      ),
    // bloodTests field removed for now
  })
  .describe(
    "Structured representation of key information extracted from medical report(s)."
  );

type MedicalReportData = z.infer<typeof medicalReportSchema>;

async function extractDataWithAI(
  fetchedFiles: FetchedFileData[]
): Promise<{ extractedObject?: MedicalReportData; processingError?: string }> {
  let extractedObject: MedicalReportData | undefined = undefined;
  let processingError: string | undefined = undefined;
  let aiModel: LanguageModel;

  try {
    aiModel = getAiModel(); // Get initialized model, checks API key
  } catch (err) {
    return {
      processingError:
        err instanceof Error ? err.message : "AI model initialization failed.",
    };
  }

  const aiContent: AiContentPart[] = [
    {
      type: "text",
      text: `Analyze the following medical report file(s) according to the provided schema. Extract the report title, patient details (name, sex, age), lab information (name, director, contact), doctor, report date (as string), and sample date (as string). For string fields like patient name, lab name etc., the schema defaults to \'not found\' if the information is missing - DO NOT explicitly output \'not found\' for those unless it\'s the actual text. For date strings (sampleDate, reportDate), if the date is not found, return the string \'not found\'. Consolidate information if multiple documents are provided. DO NOT extract individual blood test results for now.`,
    },
  ];

  const successfullyFetchedFiles = fetchedFiles.filter(
    (f) => !f.error && f.fileBuffer.length > 0
  );

  if (successfullyFetchedFiles.length > 0) {
    successfullyFetchedFiles.forEach((fetchedFile) => {
      aiContent.push({
        type: "file",
        data: fetchedFile.fileBuffer,
        mimeType: fetchedFile.fileType,
      });
    });

    try {
      const { object } = await generateObject({
        model: aiModel,
        schema: medicalReportSchema,
        messages: [{ role: "user", content: aiContent }],
      });
      extractedObject = object;
    } catch (err) {
      console.error("Error calling generateObject:", err);
      processingError =
        err instanceof Error ? err.message : "AI processing error";
    }
  } else {
    processingError = "No files could be successfully fetched or processed.";
    console.error(processingError);
  }

  return { extractedObject, processingError };
}

// Renamed parameter for clarity and added return type
const processReportMetadata = async (
  initialReport: IReport
): Promise<IReport | null> => {
  const reportId = initialReport._id;
  console.log(`Starting metadata processing for report: ${reportId}`);

  let filesWithUrls: ReportFileWithUrl[] = [];
  try {
    filesWithUrls = await generateSignedUrlsForProcessing(initialReport.files);
  } catch (error) {
    console.error(`Error generating signed URLs for ${reportId}:`, error);
    // Update DB with failure status immediately
    const updateData: Partial<IReport> = {
      metadataStatus: "failed",
      overallStatus: "failed",
      metadataError:
        error instanceof Error ? error.message : "Signed URL generation failed",
    };
    return await Report.findByIdAndUpdate(reportId, updateData, {
      new: true,
    }).lean<IReport>();
  }

  const fetchedFilesData = await fetchFileContentsForProcessing(filesWithUrls);
  const filesWithError = fetchedFilesData.filter((f) => f.error);
  if (filesWithError.length > 0) {
    console.warn(
      `Errors encountered fetching files for report ${reportId}:`,
      filesWithError.map((f) => `${f.fileName}: ${f.error}`)
    );
    // Decide if partial processing is okay or if it's a hard failure
    // For now, we proceed if at least one file was fetched
  }

  const successfullyFetchedFiles = fetchedFilesData.filter(
    (f) => !f.error && f.fileBuffer.length > 0
  );
  if (successfullyFetchedFiles.length === 0) {
    console.error(`No files could be fetched for report ${reportId}.`);
    const updateData: Partial<IReport> = {
      metadataStatus: "failed",
      overallStatus: "failed",
      metadataError: "Failed to fetch any report files from S3.",
    };
    return await Report.findByIdAndUpdate(reportId, updateData, {
      new: true,
    }).lean<IReport>();
  }

  // Only proceed with AI if we have files
  const { extractedObject, processingError: aiError } = await extractDataWithAI(
    successfullyFetchedFiles // Use only successfully fetched files
  );

  // Determine Final Statuses and Prepare Update Data
  const finalMetadataStatus: ProcessingPhaseStatus = aiError
    ? "failed"
    : "completed";
  // If metadata fails, overall fails. If metadata succeeds, overall becomes partial.
  const finalOverallStatus: OverallStatus =
    finalMetadataStatus === "failed"
      ? "failed"
      : initialReport.overallStatus === "completed" // Check if tests were already done
      ? "completed"
      : "partial"; // Metadata done, but tests might be pending/failed

  const updateData: Partial<IReport> = {
    metadataStatus: finalMetadataStatus,
    overallStatus: finalOverallStatus,
    metadataError: aiError, // Store the specific error for this phase
    // Only update metadata fields if extraction was successful
    ...(!aiError && extractedObject
      ? {
          // Use extracted data, falling back to initial report data only if necessary (shouldn't happen with defaults)
          title: extractedObject.title ?? initialReport.title,
          patientName: extractedObject.patientName ?? initialReport.patientName,
          patientSex: extractedObject.patientSex ?? initialReport.patientSex,
          patientAge: extractedObject.patientAge ?? initialReport.patientAge,
          labName: extractedObject.labName ?? initialReport.labName,
          referringDoctor:
            extractedObject.referringDoctor ?? initialReport.referringDoctor,
          sampleDate: extractedObject.sampleDate ?? initialReport.sampleDate,
          reportDate: extractedObject.reportDate ?? initialReport.reportDate,
          labDirector: extractedObject.labDirector ?? initialReport.labDirector,
          labContact: extractedObject.labContact ?? initialReport.labContact,
        }
      : {}),
  };

  // Update Report in DB and return the *updated* document
  try {
    const updatedReport = await Report.findByIdAndUpdate(reportId, updateData, {
      new: true, // Return the modified document
    }).lean<IReport>(); // Use lean for plain object

    if (!updatedReport) {
      console.error(
        `Failed to update or find report ${reportId} after processing.`
      );
      return null; // Report might have been deleted concurrently?
    }

    console.log(
      `Finished metadata processing for report ${reportId}. Final status: ${updatedReport.metadataStatus}`
    );
    return updatedReport;
  } catch (dbError) {
    console.error(
      `Database error updating report ${reportId} after metadata processing:`,
      dbError
    );
    // Return null or throw, depending on desired error handling
    return null; // Indicates update failure
  }
};
