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

type AiContentPart =
  | { type: "text"; text: string }
  | { type: "file"; data: Buffer; mimeType: string };

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
  const successfullyFetchedFiles = fetchedFilesData.filter(
    (f) => !f.error && f.fileBuffer.length > 0
  );

  if (successfullyFetchedFiles.length === 0) {
     console.error(`Failed to fetch content for tests in report ${reportId}.`);
     // Pass reportId directly
     return await updateReportWithError(reportId, 'testsStatus', 'testsError', "Failed to fetch content for any report files.", selectionString);
   }

  // 3. Extract Data with AI
  const { extractedObject, processingError: aiError } = await extractTestsDataWithAI(
    successfullyFetchedFiles
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
  fetchedFiles: FetchedFileData[]
): Promise<{ extractedObject?: ExtractedBloodTestsData; processingError?: string }> {
  let aiModel: LanguageModel;
  try {
    aiModel = getAiModel();
  } catch (err) {
    console.error("Error getting AI model for tests:", err);
    return { processingError: err instanceof Error ? err.message : "AI model initialization failed." };
  }

  // Construct the detailed prompt
  const prompt = `
Analyze the provided medical report file(s) and extract blood test results according to the schema.
Structure the output into two main categories: 'gauge' and 'table'.

1.  **Gauge Tests:** Identify key biomarkers typically monitored closely (like Hemoglobin, Glucose, Total Cholesterol, LDL, HDL, Triglycerides). Place these individual test results in the 'gauge' array. Ensure each result includes 'test' name, 'result' value (numeric or string), 'unit', and 'referenceRange' (with min/max or text). Extract interpretation (High/Low/Normal) if available.

2.  **Table Tests:** Group remaining tests into panels or categories (like CBC, Complete Blood Count, BMP, Basic Metabolic Panel, CMP, Comprehensive Metabolic Panel, Liver Function Tests, Lipid Panel, Thyroid Panel, Urinalysis etc.).
    - For each group, create an object in the 'table' array with a 'group' name (e.g., 'CBC').
    - Populate the 'tests' array within that group with the individual TestResultSchema objects belonging to that panel.
    - Include 'test' name, 'result', 'unit', 'referenceRange', and 'interpretation' for each test within the group.
    - If a test doesn't clearly belong to a common panel, create a group named 'Other Tests' or use the section header from the report as the group name.

**Important:**
- Extract numeric values for results and reference ranges where possible.
- If a range is like '< 150' or '> 10', use the 'text' field in referenceRange.
- Accurately capture test names and units as presented in the report.
- Consolidate results if multiple reports are provided for the same patient.
- Adhere strictly to the provided Zod schema: ${JSON.stringify(BloodTestsDataZodSchema.description)}
`;

  const aiContent: AiContentPart[] = [
    { type: "text", text: prompt },
    ...fetchedFiles.map((file) => ({
      type: "file" as const,
      data: file.fileBuffer,
      mimeType: file.fileType,
    })),
  ];

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
