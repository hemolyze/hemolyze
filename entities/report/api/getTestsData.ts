import { connect } from "@/lib/db";
import mongoose, { Types } from "mongoose";
import { notFound } from "next/navigation";
import { generateObject, LanguageModel } from "ai";
import Report, {
  IReport,
  OverallStatus,
  ProcessingPhaseStatus,
  BloodTestsData,
  BloodTestsDataZodSchema,
} from "@/lib/models/Report";
import { getAiModel } from "@/shared/lib/ai/anthropic";
import {
  generateSignedUrlsForProcessing,
  ReportFileWithUrl,
} from "../lib/generateSignedUrls";
import {
  fetchFileContentsForProcessing,
  FetchedFileData,
} from "../lib/fetchFileContents";

// --- Zod Schemas --- Now imported from @/lib/models/Report ---
// const TestResultSchema = z.object({...});
// const GroupedTableTestSchema = z.object({...});
// const BloodTestsDataSchema = z.object({...}); // Renamed to BloodTestsDataZodSchema in model

// Type alias for the data structure returned by the AI extraction
// Use the type imported from the model
type ExtractedBloodTestsData = BloodTestsData;

// Define the specific fields to return from this API function
// We return the extracted data along with the status fields
export type LimitedReportTestsData = Pick<
  IReport,
  'testsData' | 'testsStatus' | 'overallStatus' | 'testsError'
>;

// Update AiContentPart to include images
type AiContentPart =
  | { type: "text"; text: string }
  | { type: "file"; data: Buffer; mimeType: string }
  | { type: "image"; image: string; mimeType: string }; // Added image type

// --- Helper function and Type Definition (moved outside extractTestsDataWithAI) ---

// Helper function for mapping, keeps map logic clean
function mapFileToContentPart(file: FetchedFileData): 
  | { type: "image"; image: string; mimeType: string }
  | { type: "file"; data: Buffer; mimeType: string }
  | null
{ 
  if (file.fileType.startsWith('image/') && file.signedUrl) {
    return {
      type: "image" as const,
      image: file.signedUrl,
      mimeType: file.fileType,
    };
  } else if (file.fileBuffer.length > 0) {
     return {
       type: "file" as const,
       data: file.fileBuffer,
       mimeType: file.fileType,
     };
  }
  return null; // Explicitly return null if neither condition met
}

// Define the types that the file mapping step can produce (excluding null)
// This represents only the image or file parts, not the text part or null
type MappedContentPart = NonNullable<ReturnType<typeof mapFileToContentPart>>;

// --- End Helper function and Type Definition ---

/**
 * Fetches or processes the blood test results for a specific report.
 * If results are pending or failed, triggers AI processing.
 * Returns a limited set of fields including the testsData and status.
 */
export async function getTestsData(
  id: string
): Promise<LimitedReportTestsData | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log(`Invalid report ID format for tests: ${id}`);
    notFound();
  }

  await connect();

  // Fetch initial state, selecting only fields needed for decision + return
  const initialReport = await Report.findById(id)
    .select("testsData testsStatus overallStatus testsError files metadataStatus") // Also select metadataStatus for overall calc
    .lean<IReport>(); // Fetch as IReport initially, cast later

  if (!initialReport) {
    console.log(`Report not found for tests: ID ${id}`);
    notFound();
  }

  // Check if test data processing is needed
  if (
    initialReport.testsStatus === "pending" ||
    initialReport.testsStatus === "failed"
  ) {
    console.log(
      `Report ${id} tests status is ${initialReport.testsStatus}. Triggering processing.`
    );
    // Process tests and return the limited updated data
    return await processReportTests(initialReport);
  }

  // If no processing needed, cast and return the initially fetched limited data
  // Ensure testsData exists before accessing, provide default if null/undefined
  return {
     testsData: initialReport.testsData ?? null,
     testsStatus: initialReport.testsStatus,
     overallStatus: initialReport.overallStatus,
     testsError: initialReport.testsError,
  };
}

/**
 * Orchestrates the processing of blood test data extraction for a report.
 * Generates signed URLs, fetches file content, calls AI, and updates the DB.
 */
const processReportTests = async (
  fullReport: IReport
): Promise<LimitedReportTestsData | null> => {
  const reportId = fullReport._id;
  console.log(`Starting tests data processing for report: ${reportId}`);

  const selectionString = "testsData testsStatus overallStatus testsError";

  // 1. Generate Signed URLs
  let filesWithUrls: ReportFileWithUrl[];
  try {
    filesWithUrls = await generateSignedUrlsForProcessing(fullReport.files);
    // Add checks for failures as in getMetadata
  } catch (error) {
    console.error(`Critical error generating signed URLs for tests ${reportId}:`, error);
    // Pass reportId directly (it's already ObjectId)
    return await updateReportWithError(
        reportId,
        'testsStatus',
        'testsError',
        error instanceof Error ? error.message : "Signed URL generation failed",
        selectionString
    );
  }

  // 2. Fetch File Contents
  const validFilesForFetching = filesWithUrls.filter(f => f.signedUrl);
   if (validFilesForFetching.length === 0 && fullReport.files.length > 0) {
       console.error(`No valid signed URLs for tests in report ${reportId}.`);
       // Pass reportId directly
       return await updateReportWithError(reportId, 'testsStatus', 'testsError', "Failed to generate any valid signed URLs.", selectionString);
   } else if (fullReport.files.length === 0) {
       console.warn(`Report ${reportId} has no files for test extraction.`);
       // Pass reportId directly
       return await updateReportWithError(reportId, 'testsStatus', 'testsError', "Report has no associated files.", selectionString);
   }

  const fetchedFilesData = await fetchFileContentsForProcessing(validFilesForFetching);
  
  // Adjust filtering to include images with signedUrls
  const successfullyProcessedFilesOrImages = fetchedFilesData.filter(
    (f) => !f.error && (f.fileBuffer.length > 0 || (f.fileType.startsWith('image/') && f.signedUrl))
  );

  if (successfullyProcessedFilesOrImages.length === 0) {
     console.error(`Failed to fetch content or get link for tests in report ${reportId}.`); // Updated message
     // Pass reportId directly
     return await updateReportWithError(reportId, 'testsStatus', 'testsError', "Failed to process any report files/images.", selectionString); // Updated message
   }
   
   // Log if some files failed processing
   const failedProcessing = fetchedFilesData.filter(f => f.error || !(f.fileBuffer.length > 0 || (f.fileType.startsWith('image/') && f.signedUrl)));
   if (failedProcessing.length > 0) {
      console.warn(`Failed to process some files/images for tests: ${failedProcessing.map(f => `${f.fileName}: ${f.error || 'No buffer or image link'}`).join("; ")}`);
      // Proceeding with successfully processed files/images
  }

  // 3. Extract Data with AI
  const { extractedObject, processingError: aiError } = await extractTestsDataWithAI(
    successfullyProcessedFilesOrImages // Pass the correctly filtered list
  );

  // 4. Determine Final Statuses and Prepare Update Data
  const finalTestsStatus: ProcessingPhaseStatus = aiError ? "failed" : "completed";
  // Overall completes only if both metadata AND tests are complete.
  // Need metadataStatus from the fullReport
  const finalOverallStatus: OverallStatus =
    finalTestsStatus === "failed" || fullReport.metadataStatus !== "completed"
      ? finalTestsStatus === "failed" ? "failed" : "partial" // If tests fail -> failed; if metadata not done -> partial
      : "completed"; // Only completed if tests succeed AND metadata was already complete

  const updateData: Partial<IReport> = {
    testsStatus: finalTestsStatus,
    overallStatus: finalOverallStatus,
    testsError: aiError, // Store AI error if any
    // Use null coalescing in case extractedObject is undefined/null even without an error
    testsData: !aiError ? (extractedObject ?? null) : fullReport.testsData,
  };

  // 5. Update Report in DB
  try {
    const updatedLimitedReport = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true } // Return the modified document
    )
    .select(selectionString) // Select only the limited fields
    .lean<LimitedReportTestsData>();

    if (!updatedLimitedReport) {
      console.error(`Failed to update/find report ${reportId} after test processing.`);
      return null;
    }

    console.log(`Finished tests processing for report ${reportId}. Final status: ${updatedLimitedReport.testsStatus}`);
    return updatedLimitedReport;
  } catch (dbError) {
    console.error(`DB error updating report ${reportId} after tests processing:`, dbError);
    return null;
  }
};

/**
 * Calls the AI model to extract structured blood test data from files.
 */
async function extractTestsDataWithAI(
  fetchedFiles: FetchedFileData[] // This now includes files with signedUrl for images
): Promise<{ extractedObject?: ExtractedBloodTestsData; processingError?: string }> {
  let aiModel: LanguageModel;
  try {
    aiModel = getAiModel();
  } catch (err) {
    console.error("Error getting AI model for tests:", err);
    return { processingError: err instanceof Error ? err.message : "AI model initialization failed." };
  }

  // Construct the detailed prompt - update to mention images
  const prompt = `
Analyze the provided medical report file(s) and/or image(s) (provided as buffers or URLs) and extract blood test results according to the schema.
Structure the output into two main categories: 'gauge' and 'table'.

For EACH test result (both in 'gauge' and within 'table' groups), extract the following:
- 'test': Name of the blood test (e.g., Hemoglobin (Hb), RBC Count).
- 'result': The measured value (numeric or string like 'Not Detected').
- 'unit': Unit of measurement (e.g., g/dL, %, *10^12/L).
- 'referenceRange': The normal reference range. Extract numeric 'min'/'max' where possible. If range is text (e.g., '< 150'), use the 'text' field.
- 'interpretation': Interpretation if provided (e.g., High, Low, Normal).
- 'gaugeMin' & 'gaugeMax': Determine the absolute minimum and maximum values for a visualization scale (like a gauge meter) for this specific test. These values should encompass the reference range and the patient's result, providing reasonable padding. For example, if Hemoglobin result is 10.2 g/dL and range is 11-16, gaugeMin might be 6 and gaugeMax might be 20. If these absolute bounds aren't explicitly stated, estimate logical values based on typical physiological ranges or by extending ~25-50% beyond the reference range width from the reference min/max, ensuring the patient result fits comfortably within.

Categorize the tests:
1.  **Gauge Tests:** Identify key biomarkers typically monitored closely (like Hemoglobin, Glucose, Total Cholesterol, LDL, HDL, Triglycerides) and place their full TestResult objects (including gaugeMin/Max) in the 'gauge' array.

2.  **Table Tests:** Group remaining tests into panels or categories (like CBC, BMP, CMP, Liver Panel, etc.).
    - Create objects in the 'table' array with a 'group' name.
    - Populate the 'tests' array within that group with the full TestResult objects (including gaugeMin/Max).
    - Use 'Other Tests' or section headers for ungrouped tests.

**Important:**
- Prioritize extracting numeric values for results, reference ranges, and gauge bounds.
- Accurately capture test names and units.
- Consolidate results if multiple reports/images are provided.
- Adhere strictly to the provided Zod schema structure.
`;

  // 1. Create the array of file/image parts first
  const fileAndImageParts: MappedContentPart[] = fetchedFiles
      .map(mapFileToContentPart) // Use the helper function (now defined outside)
      .filter((item): item is MappedContentPart => item !== null); // Filter out nulls

  // 2. Combine the text prompt with the file/image parts
  const aiContent: AiContentPart[] = [
    { type: "text", text: prompt },
    ...fileAndImageParts, // Now spreading a correctly typed array
  ];

  // Check if we only have the text prompt (no processable files/images)
  if (aiContent.length <= 1) {
      console.warn("No processable files or images found to send to AI for test extraction.");
      return { processingError: "No processable files or images found." };
  }

  try {
    console.log("Calling generateObject for test data extraction...");
    const { object } = await generateObject({
      model: aiModel,
      schema: BloodTestsDataZodSchema,
      messages: [{ role: "user", content: aiContent }],
    });
    console.log("AI test data extraction successful.");
    return { extractedObject: object };
  } catch (err) {
    console.error("Error calling generateObject for tests:", err);
    return { processingError: err instanceof Error ? err.message : "AI processing error" };
  }
}

/**
 * Helper function to update report status on error during processing.
 */
async function updateReportWithError(
    reportId: Types.ObjectId,
    statusField: 'testsStatus' | 'metadataStatus',
    errorField: 'testsError' | 'metadataError',
    errorMessage: string,
    selectionString: string
): Promise<LimitedReportTestsData | null> {
    const updateData: Partial<IReport> = {
        [statusField]: "failed",
        overallStatus: "failed",
        [errorField]: errorMessage,
    };
    try {
        return await Report.findByIdAndUpdate(reportId, updateData, { new: true })
            .select(selectionString)
            .lean<LimitedReportTestsData>();
    } catch (dbError) {
        console.error(`DB error during error update for report ${reportId}:`, dbError);
        return null;
    }
}
