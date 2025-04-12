import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import Report, { IReportFile } from "@/lib/models/Report"; // Import the Report model and IReportFile type
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"; // AWS SDK S3 Client
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // AWS SDK S3 Presigner
import { generateText } from 'ai'; // Vercel AI SDK
import { LanguageModel } from 'ai'; // Import LanguageModel type
import { anthropic } from '@ai-sdk/anthropic'; // Anthropic provider

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
  | { type: 'text'; text: string } 
  | { type: 'file'; data: Buffer; mimeType: string };

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
            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
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
async function fetchFileContents(filesWithUrls: ReportFileWithUrl[]): Promise<FetchedFileData[]> {
    return Promise.all(
        filesWithUrls.map(async (file) => {
            try {
                const response = await fetch(file.signedUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${file.fileName}: ${response.statusText}`);
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
 * Extracts text from fetched file contents using the AI model.
 */
async function extractTextFromFiles(
    fetchedFiles: FetchedFileData[],
    aiModel: LanguageModel // Use the imported LanguageModel type
): Promise<{ extractedCombinedText?: string; processingError?: string }> {

    let extractedCombinedText: string | undefined = undefined;
    let processingError: string | undefined = undefined;

    const aiContent: AiContentPart[] = [
        {
            type: 'text',
            text: 'Analyze the following medical report files. Extract and consolidate key medical information, including test names, values, and units from all documents. If possible, indicate the source file for distinct sets of results.',
        },
    ];

    const successfullyFetchedFiles = fetchedFiles.filter(f => !f.error && f.fileBuffer.length > 0);

    if (successfullyFetchedFiles.length > 0) {
        successfullyFetchedFiles.forEach(fetchedFile => {
            aiContent.push({
                type: 'file',
                data: fetchedFile.fileBuffer,
                mimeType: fetchedFile.fileType,
            });
        });

        try {
            const { text } = await generateText({
                model: aiModel, // Pass the initialized model
                messages: [{ role: 'user', content: aiContent }],
            });
            extractedCombinedText = text;
        } catch (err) {
            console.error("Error calling generateText:", err);
            processingError = err instanceof Error ? err.message : "AI processing error";
        }
    } else {
        processingError = "No files could be successfully fetched for processing.";
        console.error(processingError);
    }

    return { extractedCombinedText, processingError };
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
    const body: { uploadedFiles: { fileName: string; filePath: string; fileType: string; fileSize: number }[] } = await request.json();
    const { uploadedFiles } = body;
    if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
      // Add more detailed validation as needed
      return NextResponse.json({ error: "Missing or invalid uploadedFiles data" }, { status: 400 });
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

    // 9. Extract Text using AI
    const aiModel = anthropic('claude-3-5-sonnet-latest'); // Initialize model here
    const { extractedCombinedText, processingError } = await extractTextFromFiles(
      fetchedFilesData,
      aiModel
    );

    // 10. Prepare Final Response
    const responseReport = {
      ...newReport.toObject(),
      files: filesWithUrls, // Contains metadata + signed URLs
      extractedCombinedText: extractedCombinedText,
      processingError: processingError,
    };

    return NextResponse.json({
      success: true,
      message: "Report record created, files processed.",
      reportId: newReport._id,
      report: responseReport,
    });

  } catch (error) { // Outer catch block
    console.error("Error in POST /api/report-upload/create-record:", error);
    let errorMessage = "Internal server error";
    // Use message from thrown configuration errors
    if (error instanceof Error && (error.message.includes("Server configuration error"))) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = "An unexpected error occurred processing the request."; // More generic for other errors
    }
    // Log the original error still
    console.error("Original error details:", error);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
