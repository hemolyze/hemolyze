import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateObject, LanguageModel } from 'ai';
import { anthropic } from "@ai-sdk/anthropic";
import { z } from 'zod';
import Report, { IReportFile, IReport } from "@/lib/models/Report"; // Ensure this path is correct

// --- Zod Schema Definition ---

const medicalReportSchema = z.object({
    title: z.string().describe("The title of the report, generate based on the report content"),
    patientName: z.string().default('not found').describe("The patient's full name. Default to 'not found' if missing."),
    patientSex: z.string().default('not found').describe("The patient's sex (e.g., Male, Female). Default to 'not found' if missing."),
    patientAge: z.string().default('not found').describe("The patient's age (e.g., 35 years, 6 months). Default to 'not found' if missing."),
    labName: z.string().default('not found').describe("The name of the laboratory. Default to 'not found' if missing."),
    referringDoctor: z.string().default('not found').describe("The name of the referring doctor. Default to 'not found' if missing."),
    sampleDate: z.string().describe("The date the sample was collected, as a string. If not found, return 'not found'."),
    reportDate: z.string().describe("The date the report was issued, as a string. If not found, return 'not found'."),
    labDirector: z.string().default('not found').describe("The name of the lab director. Default to 'not found' if missing."),
    labContact: z.string().default('not found').describe("Contact information for the lab. Default to 'not found' if missing."),
    // bloodTests field removed for now
}).describe("Structured representation of key information extracted from medical report(s).");

type MedicalReportData = z.infer<typeof medicalReportSchema>;

// --- Interfaces ---

interface ReportFileWithUrl extends IReportFile {
    signedUrl: string;
}

interface FetchedFileData {
    fileName: string;
    fileType: string;
    fileBuffer: Buffer;
    error?: string;
}

type AiContentPart =
    | { type: "text"; text: string }
    | { type: "file"; data: Buffer; mimeType: string };

// --- S3/AI Client Initialization ---
// Ensure these environment variables are available in the environment where this runs
let s3ClientInstance: S3Client | null = null;
let aiModelInstance: LanguageModel | null = null;

function getS3Client(): S3Client {
    if (!s3ClientInstance) {
        if (!process.env.X_AWS_REGION || !process.env.X_AWS_ACCESS_KEY_ID || !process.env.X_AWS_SECRET_ACCESS_KEY) {
            throw new Error("Missing required AWS environment variables for S3 client.");
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

function getAiModel(): LanguageModel {
     if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
    }
    if (!aiModelInstance) {
        // Initialize the specific model you want to use
        aiModelInstance = anthropic('claude-3-5-sonnet-latest');
    }
    return aiModelInstance;
}

const S3_BUCKET_NAME = process.env.X_AWS_BUCKET_NAME;

// --- Helper Functions ---

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

async function fetchFileContentsForProcessing(filesWithUrls: ReportFileWithUrl[]): Promise<FetchedFileData[]> {
    return Promise.all(
        filesWithUrls.map(async (file) => {
            try {
                const response = await fetch(file.signedUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${file.fileName} from S3: ${response.statusText}`);
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

async function extractDataWithAI(
    fetchedFiles: FetchedFileData[]
): Promise<{ extractedObject?: MedicalReportData; processingError?: string }> {
    let extractedObject: MedicalReportData | undefined = undefined;
    let processingError: string | undefined = undefined;
    let aiModel: LanguageModel;

    try {
         aiModel = getAiModel(); // Get initialized model, checks API key
    } catch(err) {
         return { processingError: err instanceof Error ? err.message : "AI model initialization failed." };
    }


    const aiContent: AiContentPart[] = [
        {
            type: 'text',
            text: `Analyze the following medical report file(s) according to the provided schema. Extract the report title, patient details (name, sex, age), lab information (name, director, contact), doctor, report date (as string), and sample date (as string). For string fields like patient name, lab name etc., the schema defaults to \'not found\' if the information is missing - DO NOT explicitly output \'not found\' for those unless it\'s the actual text. For date strings (sampleDate, reportDate), if the date is not found, return the string \'not found\'. Consolidate information if multiple documents are provided. DO NOT extract individual blood test results for now.`,
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
            const { object } = await generateObject({
                model: aiModel,
                schema: medicalReportSchema,
                messages: [{ role: 'user', content: aiContent }],
            });
            extractedObject = object;
        } catch (err) {
            console.error("Error calling generateObject:", err);
            processingError = err instanceof Error ? err.message : "AI processing error";
        }
    } else {
        processingError = "No files could be successfully fetched or processed.";
        console.error(processingError);
    }

    return { extractedObject, processingError };
}


// --- Main Processing Function ---

/**
 * Processes a report by fetching its files, extracting structured data using AI,
 * and updating the report document in the database.
 * @param reportId The ID of the Report document to process.
 */
export async function processReport(reportId: string): Promise<void> {
    console.log(`Starting processing for report ${reportId}...`);
    try {
        // 1. Fetch Report from DB
        const report = await Report.findById(reportId);
        if (!report) {
            console.error(`Report ${reportId} not found.`);
            return;
        }

         if (report.processingStatus !== 'pending') {
             console.log(`Report ${reportId} is not pending (status: ${report.processingStatus}). Skipping.`);
             return;
        }

        // 2. Update status to processing
        await Report.findByIdAndUpdate(reportId, { processingStatus: 'processing' });
        console.log(`Report ${reportId} status updated to 'processing'.`);


        // 3. Generate URLs
        const filesWithUrls = await generateSignedUrlsForProcessing(report.files);
        console.log(`Generated ${filesWithUrls.length} signed URLs for report ${reportId}.`);


        // 4. Fetch Contents
        const fetchedFilesData = await fetchFileContentsForProcessing(filesWithUrls);
        const fetchErrors = fetchedFilesData.filter(f => f.error).map(f => f.error);
        if (fetchErrors.length > 0) {
             console.warn(`Encountered ${fetchErrors.length} errors fetching files for report ${reportId}:`, fetchErrors.join(', '));
        }


        // 5. Extract Data
        console.log(`Starting AI data extraction for report ${reportId}...`);
        const { extractedObject, processingError: aiError } = await extractDataWithAI(
            fetchedFilesData
        );
        console.log(`AI data extraction finished for report ${reportId}. Error: ${aiError ?? 'None'}`);


        // 6. Update Report in DB with results
        const finalStatus = aiError ? 'failed' : 'completed';
        const updateData: Partial<IReport> & { extractedData?: MedicalReportData } = { 
            processingStatus: finalStatus,
            errorMessage: aiError,
             // Map extractedObject fields to report fields, keeping original if extraction fails
            title: extractedObject?.title ?? report.title,
            patientName: extractedObject?.patientName ?? report.patientName,
            patientSex: extractedObject?.patientSex ?? report.patientSex,
            patientAge: extractedObject?.patientAge ?? report.patientAge,
            labName: extractedObject?.labName ?? report.labName,
            referringDoctor: extractedObject?.referringDoctor ?? report.referringDoctor,
            sampleDate: extractedObject?.sampleDate ?? report.sampleDate,
            reportDate: extractedObject?.reportDate ?? report.reportDate,
            labDirector: extractedObject?.labDirector ?? report.labDirector,
            labContact: extractedObject?.labContact ?? report.labContact,
            // You might want to store the raw extracted object too:
            // extractedData: extractedObject
        };

        await Report.findByIdAndUpdate(reportId, updateData);

        console.log(`Report ${reportId} processing finished. Final status: ${finalStatus}`);

    } catch (error) {
        console.error(`Critical error processing report ${reportId}:`, error);
        // Attempt to mark report as failed in catch block
        try {
             await Report.findByIdAndUpdate(reportId, {
                 processingStatus: 'failed',
                 errorMessage: error instanceof Error ? error.message : 'Unknown critical error during processing'
                });
            } catch (dbError) {
                 console.error(`Failed to update report ${reportId} status to failed after critical error:`, dbError);
                }
    }
} 