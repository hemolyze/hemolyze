import { connect } from "@/lib/db";
import mongoose, { Types } from "mongoose";
import { notFound } from "next/navigation";
import { LanguageModel, generateText, ImagePart, FilePart, TextPart } from "ai";
import Report, {
  IReport,
  OverallStatus,
  ProcessingPhaseStatus,
  BloodTestsData,
  BloodTestsDataZodSchema,
} from "@/lib/models/Report";
import { getAiModel } from "@/shared/lib/ai/gemini";
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

// Define a type that includes the MongoDB _id for assertion
type IndividualTestResultType = BloodTestsData['gauge'][number]; // Infer the base test result type
type TestResultWithId = IndividualTestResultType & { _id?: Types.ObjectId };

// --- Helper function and Type Definition (moved outside extractTestsDataWithAI) ---

// Update helper function to return specific SDK types
function mapFileToContentPart(file: FetchedFileData): ImagePart | FilePart | null
{ 
  if (file.fileType.startsWith('image/') && file.signedUrl) {
    return {
      type: "image" as const,
      image: file.signedUrl, // URL is valid for image part
      mimeType: file.fileType,
    };
  } else if (file.fileBuffer.length > 0) {
     return {
       type: "file" as const,
       data: file.fileBuffer,
       mimeType: file.fileType,
     };
  }
  return null;
}

// MappedContentPart now reflects the SDK types
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

  // --- BEGIN: Manually add _id to each test result ---
  if (extractedObject && !aiError) {
    // Ensure Types is imported from mongoose at the top: import mongoose, { Types } from 'mongoose';

    // Add _id to tests in the 'gauge' array
    if (extractedObject.gauge) {
      extractedObject.gauge.forEach(test => {
        if (!(test as TestResultWithId)._id) { // Use helper type for assertion
           (test as TestResultWithId)._id = new Types.ObjectId(); // Use helper type for assertion
        }
      });
    }

    // Add _id to tests within each group in the 'table' array
    if (extractedObject.table) {
      extractedObject.table.forEach(group => {
        if (group.tests) {
          group.tests.forEach(test => {
            if (!(test as TestResultWithId)._id) { // Use helper type for assertion
              (test as TestResultWithId)._id = new Types.ObjectId(); // Use helper type for assertion
            }
          });
        }
      });
    }
    console.log(`Added MongoDB ObjectIds to ${extractedObject.gauge?.length || 0} gauge tests and tests within ${extractedObject.table?.length || 0} table groups.`);
  }
  // --- END: Manually add _id to each test result ---

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

  // Construct the detailed prompt with explicit JSON structure
  const promptText = `
Analyze the provided medical report file(s) and/or image(s) and extract blood test results.
Return your response as a JSON string with this exact structure:
{
  "gauge": [
    {
      "test": "string",
      "result": "number or string",
      "unit": "string",
      "referenceRange": {
        "min": "number (optional)",
        "max": "number (optional)",
        "text": "string (optional)"
      },
      "interpretation": "string",
      "gaugeMin": "number",
      "gaugeMax": "number"
    }
  ],
  "table": [
    {
      "group": "string",
      "tests": [
        {
          // same structure as gauge items
        }
      ]
    }
  ]
}

For EACH test result (both in 'gauge' and within 'table' groups), extract:
- 'test': Name of the blood test (e.g., Hemoglobin (Hb), RBC Count)
- 'result': The measured value (numeric or string like 'Not Detected')
- 'unit': Unit of measurement (e.g., g/dL, %, *10^12/L)
- 'referenceRange': The normal reference range. Extract numeric 'min'/'max' where possible. If range is text (e.g., '< 150'), use the 'text' field
- 'interpretation': Interpretation if provided (e.g., High, Low, Normal)
- 'gaugeMin' & 'gaugeMax': Determine absolute minimum and maximum values for visualization

Categorize the tests:
1. Gauge Tests: Key biomarkers typically monitored closely (like Hemoglobin, Glucose, etc.)
2. Table Tests: Group remaining tests into panels or categories (like CBC, BMP, etc.)

IMPORTANT: 
- Your response must be a valid JSON string that exactly matches the structure above
- Do not include any explanatory text before or after the JSON
- Ensure all numeric values are actual numbers, not strings
`;

  // Create the array of file/image parts using specific SDK types
  const fileAndImageParts: (ImagePart | FilePart)[] = fetchedFiles
    .map(mapFileToContentPart)
    .filter((item): item is MappedContentPart => item !== null);

  // Construct the message content array with explicit types
  const messageContent: (TextPart | ImagePart | FilePart)[] = [
    { type: "text", text: promptText }, // Explicitly TextPart
    ...fileAndImageParts,
  ];

  if (messageContent.length <= 1) { // Check if only text part exists
    console.warn("No processable files or images found to send to AI for test extraction.");
    return { processingError: "No processable files or images found." };
  }

  try {
    console.log("Requesting test data extraction from AI...");
    const { text: rawResponse } = await generateText({
      model: aiModel,
      // Pass the correctly typed message structure
      messages: [{ role: "user", content: messageContent }]
    });

    // Clean potential markdown fences from the response
    const cleanedResponse = rawResponse
      .trim() // Remove leading/trailing whitespace
      .replace(/^```json\s*/, '') // Remove leading ```json
      .replace(/\s*```$/, '');    // Remove trailing ```

    // Parse the cleaned response as JSON and validate against our schema
    try {
      const parsedData = JSON.parse(cleanedResponse);
      const validatedData = BloodTestsDataZodSchema.parse(parsedData);
      console.log("AI test data extraction and validation successful.");
      return { extractedObject: validatedData };
    } catch (parseError) {
      console.error("Error parsing or validating cleaned AI response:", parseError);
      console.error("Cleaned AI Response was:", cleanedResponse); // Log the cleaned response for debugging
      return { processingError: "Failed to parse AI response into valid test data structure" };
    }
  } catch (err) {
    console.error("Error getting AI completion for tests:", err);
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
