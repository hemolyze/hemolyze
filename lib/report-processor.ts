import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateObject, LanguageModel } from 'ai';
import { anthropic } from "@ai-sdk/anthropic";
import { z } from 'zod';
import Report, { IReportFile, IReport, OverallStatus, ProcessingPhaseStatus } from "@/lib/models/Report"; // Ensure this path is correct

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
 * Processes the METADATA EXTRACTION phase for a report.
 * Fetches files, extracts structured metadata using AI,
 * and updates the report document status and fields.
 * @param reportId The ID of the Report document to process.
 */
async function processMetadata(reportId: string): Promise<void> { // Renamed for clarity
    console.log(`Starting METADATA processing for report ${reportId}...`);

    try {
        // 1. Fetch Report from DB
        // Fetch the full document instance to easily access properties
        const report = await Report.findById(reportId);
        if (!report) {
            console.error(`Report ${reportId} not found for metadata processing.`);
            return;
        }

        // Check if metadata processing is needed and overall status allows it
        if (report.metadataStatus !== 'pending') {
             console.log(`Report ${reportId} metadata status is not pending (${report.metadataStatus}). Skipping metadata processing.`);
             return;
        }
         if (report.overallStatus === 'completed' || report.overallStatus === 'failed') {
             console.log(`Report ${reportId} overall status is ${report.overallStatus}. Skipping metadata processing.`);
             return;
         }


        // 2. Update status to processing
        const statusUpdate: Partial<IReport> = { metadataStatus: 'processing' };
         if (report.overallStatus === 'pending') {
             statusUpdate.overallStatus = 'processing';
         }
        await Report.findByIdAndUpdate(reportId, statusUpdate);
        console.log(`Report ${reportId} status updated to 'processing' for metadata.`);


        // 3. Generate URLs
        const filesWithUrls = await generateSignedUrlsForProcessing(report.files);
        console.log(`Generated ${filesWithUrls.length} signed URLs for report ${reportId}.`);


        // 4. Fetch Contents
        const fetchedFilesData = await fetchFileContentsForProcessing(filesWithUrls);
        // Optional: Check for fetch errors early if needed


        // 5. Extract Metadata using AI
        console.log(`Starting AI metadata extraction for report ${reportId}...`);
        const { extractedObject, processingError: aiError } = await extractDataWithAI(
            fetchedFilesData
        );
        console.log(`AI metadata extraction finished for report ${reportId}. Error: ${aiError ?? 'None'}`);


        // 6. Determine Final Statuses and Prepare Update Data
        const finalMetadataStatus: ProcessingPhaseStatus = aiError ? 'failed' : 'completed';
        // If metadata fails, overall fails. If metadata succeeds, overall becomes partial.
        const finalOverallStatus: OverallStatus = aiError ? 'failed' : 'partial';

        const updateData: Partial<IReport> = {
            metadataStatus: finalMetadataStatus,
            overallStatus: finalOverallStatus,
            metadataError: aiError, // Store the specific error for this phase
            // Only update metadata fields if extraction was successful
            ...( !aiError && extractedObject ? {
                    title: extractedObject.title ?? report.title,
                    patientName: extractedObject.patientName ?? report.patientName,
                    patientSex: extractedObject.patientSex ?? report.patientSex,
                    patientAge: extractedObject.patientAge ?? report.patientAge,
                    labName: extractedObject.labName ?? report.labName,
                    referringDoctor: extractedObject.referringDoctor ?? report.referringDoctor,
                    sampleDate: extractedObject.sampleDate ?? report.sampleDate,
                    reportDate: extractedObject.reportDate ?? report.reportDate,
                    labDirector: extractedObject.labDirector ?? report.labDirector,
                    labContact: extractedObject.labContact ?? report.labContact,
                    // Maybe store raw extracted metadata object if needed:
                    // extractedMetadata: extractedObject
            } : {}),
        };

        // 7. Update Report in DB with results
        await Report.findByIdAndUpdate(reportId, updateData);

        console.log(`Report ${reportId} METADATA processing finished. Metadata status: ${finalMetadataStatus}, Overall status: ${finalOverallStatus}`);

    } catch (error) {
        console.error(`Critical error during METADATA processing for report ${reportId}:`, error);
        // Attempt to mark report as failed in catch block
        try {
            // Ensure we revert overall status if it was changed to processing
             const failureUpdate: Partial<IReport> = {
                 metadataStatus: 'failed', // Mark this phase as failed
                 metadataError: error instanceof Error ? error.message : 'Unknown critical error during metadata processing',
                 overallStatus: 'failed' // Mark overall as failed on critical error
             };
             await Report.findByIdAndUpdate(reportId, failureUpdate);
            } catch (dbError) {
                 console.error(`Failed to update report ${reportId} status to failed after critical error:`, dbError);
                }
    }
}

// Keep the original export name but maybe rename internally later if needed
export { processMetadata as processReport }; 