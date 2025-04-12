import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import Report, { IReportFile } from "@/lib/models/Report"; // Import the Report model and IReportFile type
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"; // AWS SDK S3 Client
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // AWS SDK S3 Presigner
import { generateObject } from "ai"; // Changed from generateText
import { LanguageModel } from "ai"; // Import LanguageModel type
import { anthropic } from "@ai-sdk/anthropic"; // Anthropic provider
import { z } from "zod"; // Import Zod

// Interface for the file object including the signed URL
interface ReportFileWithUrl extends IReportFile {
  signedUrl: string;
  // Removed extractedText and error from individual file
}

// Temporary interface to hold fetched file data
interface FetchedFileData {
  fileName: string;
  fileType: string;
  fileBuffer: Buffer;
  error?: string;
}

// Define the possible shapes for content parts
type AiContentPart =
  | { type: "text"; text: string }
  | { type: "file"; data: Buffer; mimeType: string };

// Initialize S3 Client - reads credentials and region from environment variables
// Ensure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION are set
const s3Client = new S3Client({
  region: process.env.X_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.X_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.X_AWS_SECRET_ACCESS_KEY!,
  },
});
const S3_BUCKET_NAME = process.env.X_AWS_BUCKET_NAME;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY; // Ensure this is set

// Ensure required environment variables are checked once at startup if possible,
// but for API routes, checking per request is safer.
function checkEnvironmentVariables() {
  if (!S3_BUCKET_NAME) {
    console.error("S3_BUCKET_NAME environment variable is not set.");
    throw new Error("Server configuration error: Missing S3 bucket name.");
  }
  if (!ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY environment variable is not set.");
    throw new Error("Server configuration error: Missing Anthropic API key.");
  }
}

// --- Zod Schema Definition ---

// Keep bloodTestSchema defined for potential later use, but remove from medicalReportSchema for now
// const bloodTestSchema = z.object({ /* ... */ });

// Updated schema reflecting IReport structure - WITHOUT bloodTests for now
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
      ), // Assuming required based on last user change
    reportDate: z
      .string()
      .describe(
        "The date the report was issued, as a string. If not found, return 'not found'."
      ), // Assuming required based on last user change
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
    // bloodTests: z.array(bloodTestSchema).describe("An array containing extracted blood test results."),
  })
  .describe(
    "Structured representation of key information extracted from medical report(s)."
  );

// Type inferred from the schema
type MedicalReportData = z.infer<typeof medicalReportSchema>;

// --- Helper Functions ---

/**
 * Generates pre-signed S3 GET URLs for report files.
 */
async function generateSignedUrls(
  files: IReportFile[],
  bucketName: string,
  s3Client: S3Client
): Promise<ReportFileWithUrl[]> {
  return Promise.all(
    files.map(async (file) => {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: file.filePath,
      });
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });
      return {
        // Ensure all properties from IReportFile are included
        fileName: file.fileName,
        filePath: file.filePath,
        fileType: file.fileType,
        fileSize: file.fileSize,
        signedUrl: signedUrl,
      };
    })
  );
}

/**
 * Fetches the content of files from S3 using their signed URLs.
 */
async function fetchFileContents(
  filesWithUrls: ReportFileWithUrl[]
): Promise<FetchedFileData[]> {
  return Promise.all(
    filesWithUrls.map(async (file) => {
      try {
        const response = await fetch(file.signedUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${file.fileName}: ${response.statusText}`
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
          fileBuffer: Buffer.alloc(0), // Empty buffer on error
          error: err instanceof Error ? err.message : "Unknown fetch error",
        };
      }
    })
  );
}

/**
 * Extracts structured data from fetched file contents using the AI model and a Zod schema.
 */
async function extractStructuredDataFromFiles(
  fetchedFiles: FetchedFileData[],
  aiModel: LanguageModel
): Promise<{ extractedObject?: MedicalReportData; processingError?: string }> {
  let extractedObject: MedicalReportData | undefined = undefined;
  let processingError: string | undefined = undefined;

  const aiContent: AiContentPart[] = [
    {
      type: "text",
      // Updated prompt to EXCLUDE blood tests
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
        // Consider adding mode: 'json' if needed, though often inferred
      });
      extractedObject = object;
    } catch (err) {
      console.error("Error calling generateObject:", err);
      processingError =
        err instanceof Error ? err.message : "AI processing error";
    }
  } else {
    processingError = "No files could be successfully fetched for processing.";
    console.error(processingError);
  }

  return { extractedObject, processingError };
}

export const POST = async (request: NextRequest) => {
  try {
    // 1. Authentication & Authorization
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check Environment Variables
    checkEnvironmentVariables(); // Throws error if missing

    // 3. Parse and Validate Input
    const body: {
      uploadedFiles: {
        fileName: string;
        filePath: string;
        fileType: string;
        fileSize: number;
      }[];
    } = await request.json();
    const { uploadedFiles } = body;
    if (
      !uploadedFiles ||
      !Array.isArray(uploadedFiles) ||
      uploadedFiles.length === 0
    ) {
      // Add more detailed validation as needed
      return NextResponse.json(
        { error: "Missing or invalid uploadedFiles data" },
        { status: 400 }
      );
    }

    // 4. Database Connection
    await connect();

    // 5. Prepare Data for DB
    const reportFiles: IReportFile[] = uploadedFiles.map((file) => ({
      fileName: file.fileName,
      filePath: file.filePath, // S3 key
      fileType: file.fileType,
      fileSize: file.fileSize,
    }));

    // 6. Create Report Record in DB
    const newReport = await Report.create({
      userId: userId,
      files: reportFiles,
      processingStatus: "pending",
      // Dummy data - replace as needed
      patientName: "Jane Doe (Dummy)",
      patientSex: "Female",
      patientAge: "30 years",
      labName: "General Hospital Lab (Dummy)",
      referringDoctor: "Dr. Smith (Dummy)",
      reportDate: new Date(),
      bloodTests: {},
    });

    // 7. Generate Signed URLs
    const filesWithUrls = await generateSignedUrls(
      newReport.files,
      S3_BUCKET_NAME!, // Checked above
      s3Client
    );

    // 8. Fetch File Contents
    const fetchedFilesData = await fetchFileContents(filesWithUrls);

    // 9. Extract Structured Data using AI
    const aiModel = anthropic("claude-3-5-sonnet-latest");
    // Keep result as a single object to avoid unused variable lint error
    const aiExtractionResult = await extractStructuredDataFromFiles(
      fetchedFilesData,
      aiModel
    );

    // --- Now Create the DB Record ---

    // 10. Create Report Record in DB using Extracted Data
    const newReportWithExtractedData = await Report.create({
      userId: userId,
      files: reportFiles, // Store original file info (paths, names) in DB
      // Access properties directly from aiExtractionResult
      processingStatus: aiExtractionResult.processingError
        ? "failed"
        : "completed",
      errorMessage: aiExtractionResult.processingError,

      // Map fields from aiExtractionResult.extractedObject
      title: aiExtractionResult.extractedObject?.title,
      patientName: aiExtractionResult.extractedObject?.patientName,
      patientSex: aiExtractionResult.extractedObject?.patientSex,
      patientAge: aiExtractionResult.extractedObject?.patientAge,
      labName: aiExtractionResult.extractedObject?.labName,
      referringDoctor: aiExtractionResult.extractedObject?.referringDoctor,
      sampleDate: aiExtractionResult.extractedObject?.sampleDate,
      reportDate: aiExtractionResult.extractedObject?.reportDate,
      labDirector: aiExtractionResult.extractedObject?.labDirector,
      labContact: aiExtractionResult.extractedObject?.labContact,

      // Keep bloodTests empty for now as per previous request
      bloodTests: {},
    });

    // 11. Prepare Simplified Response for Client
    // Access processingError directly from aiExtractionResult
    const processingStatus = aiExtractionResult.processingError
      ? "failed"
      : "completed";

    return NextResponse.json({
      success: true,
      // Provide a message indicating outcome
      message: `Report record created. Processing status: ${processingStatus}`,
      // Only include the ID needed for routing
      reportId: newReportWithExtractedData._id,
      extractedData: newReportWithExtractedData,
    });
  } catch (error) {
    // Outer catch block
    console.error("Error in POST /api/report-upload/create-record:", error);
    let errorMessage = "Internal server error";
    // Use message from thrown configuration errors
    if (
      error instanceof Error &&
      error.message.includes("Server configuration error")
    ) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = "An unexpected error occurred processing the request."; // More generic for other errors
    }
    // Log the original error still
    console.error("Original error details:", error);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
