import { connect } from "@/lib/db";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { generateObject, LanguageModel } from "ai";
import { z } from "zod";
import Report, {
  IReport,
  OverallStatus,
  ProcessingPhaseStatus,
} from "@/lib/models/Report";
import { getAiModel } from "@/shared/lib/ai/anthropic"; // Import shared AI model getter
// Import entity-specific lib functions
import {
  generateSignedUrlsForProcessing,
  ReportFileWithUrl,
} from "../lib/generateSignedUrls";
import {
  fetchFileContentsForProcessing,
  FetchedFileData,
} from "../lib/fetchFileContents";

// Define the specific fields to return
export type LimitedReportMetadata = Pick<
  IReport,
  |"title"
  |"patientName"
  |"patientSex"
  |"labName"
  |"patientAge"
  |"referringDoctor"
  |"sampleDate"
  |"reportDate"
  |"labDirector"
  |"labContact"
  |"overallStatus"
  |"metadataStatus"
>;

// Keep this alias if used elsewhere, though getReportMetadata now returns the limited type
export type ReportMetadata = IReport;

// Update the AI Content Part type to include images
type AiContentPart =
  | { type: "text"; text: string }
  | { type: "file"; data: Buffer; mimeType: string }
  | { type: "image"; image: string; mimeType: string }; // Added image type

// Update the return type of the main function
export async function getReportMetadata(
  id: string
): Promise<LimitedReportMetadata | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log(`Invalid report ID format: ${id}`);
    notFound();
  }

  await connect();

  // Fetch the initial report state, selecting only required fields + status fields
  const initialReport = await Report.findById(id)
    .select("title patientName patientSex labName patientAge referringDoctor sampleDate reportDate labDirector labContact overallStatus metadataStatus")
    .lean<LimitedReportMetadata>();

  if (!initialReport) {
    console.log(`Report not found for ID: ${id}`);
    notFound(); // Exit if report not found initially
  }

  // Check if metadata processing is needed using the fetched status
  if (
    initialReport.metadataStatus === "pending" ||
    initialReport.metadataStatus === "failed"
  ) {
    console.log(
      `Report ${id} metadata status is ${initialReport.metadataStatus}. Triggering processing.`
    );
    // Fetch the full report needed for processing
    const fullReportForProcessing = await Report.findById(id).lean<IReport>();
    if (!fullReportForProcessing) {
      // Should not happen if initialReport was found, but handle defensively
      console.error(`Report ${id} disappeared before processing could start.`);
      return initialReport; // Return the limited data we already have
    }
    // Process metadata (will return the limited type)
    return await processReportMetadata(fullReportForProcessing);
  }

  // If no processing was needed, return the initially fetched limited report
  return initialReport;
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
  fetchedFiles: FetchedFileData[] // This now includes files with signedUrl for images
): Promise<{ extractedObject?: MedicalReportData; processingError?: string }> {
  let extractedObject: MedicalReportData | undefined = undefined;
  let processingError: string | undefined = undefined;
  let aiModel: LanguageModel;

  try {
    aiModel = getAiModel(); // Use imported function
  } catch (err) {
    console.error("Error getting AI model:", err); // Log error
    return {
      processingError:
        err instanceof Error ? err.message : "AI model initialization failed.",
    };
  }

  const aiContent: AiContentPart[] = [
    {
      type: "text",
      text: `Analyze the following medical report file(s) and/or image(s) according to the provided schema. You might receive PDF file buffers or image URLs. Extract the report title, patient details (name, sex, age), lab information (name, director, contact), doctor, report date (as string), and sample date (as string). For string fields like patient name, lab name etc., the schema defaults to 'not found' if the information is missing - DO NOT explicitly output 'not found' for those unless it's the actual text. For date strings (sampleDate, reportDate), if the date is not found, return the string 'not found'. Consolidate information if multiple documents/images are provided. DO NOT extract individual blood test results for now.`, // Updated prompt
    },
  ];

  // Filter files that have either a buffer OR a signedUrl (for images)
  const processableFiles = fetchedFiles.filter(
    (f) => !f.error && (f.fileBuffer.length > 0 || (f.fileType.startsWith('image/') && f.signedUrl))
  );

  if (processableFiles.length > 0) {
    processableFiles.forEach((fetchedFile) => {
      // Check if it's an image with a signedUrl
      if (fetchedFile.fileType.startsWith('image/') && fetchedFile.signedUrl) {
        aiContent.push({
          type: "image",
          image: fetchedFile.signedUrl, // Use the URL
          mimeType: fetchedFile.fileType,
        });
      } 
      // Otherwise, assume it's a file with a buffer (like PDF)
      else if (fetchedFile.fileBuffer.length > 0) {
        aiContent.push({
          type: "file",
          data: fetchedFile.fileBuffer,
          mimeType: fetchedFile.fileType,
        });
      }
    });

    try {
      console.log("Calling generateObject with AI model..."); // Log before call
      const { object } = await generateObject({
        model: aiModel,
        schema: medicalReportSchema,
        messages: [{ role: "user", content: aiContent }],
      });
      console.log("AI data extraction successful."); // Log success
      extractedObject = object;
    } catch (err) {
      console.error("Error calling generateObject:", err);
      processingError =
        err instanceof Error ? err.message : "AI processing error";
    }
  } else {
    // This case is handled before calling this function in processReportMetadata
    // But keep a log here just in case.
    processingError = "No successfully fetched files or images provided to AI for processing."; // Updated message
    console.warn(processingError);
  }

  return { extractedObject, processingError };
}

// Update the return type of the processing function
const processReportMetadata = async (
  fullReport: IReport // Need the full report to access files etc.
): Promise<LimitedReportMetadata | null> => {
  const reportId = fullReport._id;
  console.log(`Starting metadata processing for report: ${reportId}`);

  // Define the fields to select upon successful update or intermediate failures
  const selectionString = "title patientName patientSex labName patientAge referringDoctor sampleDate reportDate labDirector labContact overallStatus metadataStatus";

  let filesWithUrls: ReportFileWithUrl[] = [];
  try {
    // Use imported function
    filesWithUrls = await generateSignedUrlsForProcessing(fullReport.files);
    // Check if any URL generation failed (indicated by empty string)
    const failedUrlGenerations = filesWithUrls.filter(f => !f.signedUrl && f.filePath);
    if(failedUrlGenerations.length > 0) {
      console.warn(`Failed to generate signed URLs for some files: ${failedUrlGenerations.map(f => f.fileName).join(", ")}`);
      // Decide if this is a critical failure or if we can proceed with partial files
      // For now, let's proceed if at least one URL was generated
    }
  } catch (error) {
    console.error(`Critical error generating signed URLs for ${reportId}:`, error);
    const updateData: Partial<IReport> = {
      metadataStatus: "failed",
      overallStatus: "failed",
      metadataError:
        error instanceof Error ? error.message : "Signed URL generation failed",
    };
    // Update DB and select only required fields
    return await Report.findByIdAndUpdate(reportId, updateData, {
      new: true,
    })
    .select(selectionString)
    .lean<LimitedReportMetadata>();
  }

  // Filter out files for which URL generation failed before fetching
  const validFilesForFetching = filesWithUrls.filter(f => f.signedUrl);
  if (validFilesForFetching.length === 0 && fullReport.files.length > 0) {
      console.error(`No valid signed URLs generated for any files in report ${reportId}.`);
      const updateData: Partial<IReport> = {
        metadataStatus: "failed",
        overallStatus: "failed",
        metadataError: "Failed to generate any valid signed URLs.",
      };
      return await Report.findByIdAndUpdate(reportId, updateData, { new: true })
        .select(selectionString)
        .lean<LimitedReportMetadata>();
  } else if (fullReport.files.length === 0) {
       console.warn(`Report ${reportId} has no files associated. Marking metadata as failed.`);
       const updateData: Partial<IReport> = {
        metadataStatus: "failed",
        overallStatus: "failed", // Or potentially "completed" if no files means nothing to process?
        metadataError: "Report has no associated files.",
       };
       return await Report.findByIdAndUpdate(reportId, updateData, { new: true })
         .select(selectionString)
         .lean<LimitedReportMetadata>();
  }

  // Use imported function
  const fetchedFilesData = await fetchFileContentsForProcessing(validFilesForFetching);

  // Adjust filtering logic here as well, based on the updated fetch function behavior
  const successfullyFetchedOrLinkedFiles = fetchedFilesData.filter(
    (f) => !f.error && (f.fileBuffer.length > 0 || (f.fileType.startsWith('image/') && f.signedUrl))
  );

  // Handle case where fetching/linking failed for all files that had valid URLs
  if (successfullyFetchedOrLinkedFiles.length === 0) {
     console.error(`Failed to fetch content or get link for any files in report ${reportId}.`); // Updated message
     const updateData: Partial<IReport> = {
       metadataStatus: "failed",
       overallStatus: "failed",
       metadataError: "Failed to process any report files/images.", // Updated message
     };
     return await Report.findByIdAndUpdate(reportId, updateData, {
       new: true,
     })
     .select(selectionString)
     .lean<LimitedReportMetadata>();
   }

  // Log if some files failed processing (fetch error or missing link after fetch stage)
  const failedProcessing = fetchedFilesData.filter(f => f.error || !(f.fileBuffer.length > 0 || (f.fileType.startsWith('image/') && f.signedUrl)));
  if (failedProcessing.length > 0) {
      console.warn(`Failed to process some files/images: ${failedProcessing.map(f => `${f.fileName}: ${f.error || 'No buffer or image link'}`).join("; ")}`);
      // Proceeding with successfully processed files/images
  }

  const { extractedObject, processingError: aiError } = await extractDataWithAI(
    successfullyFetchedOrLinkedFiles // Pass the correctly filtered list
  );

  const finalMetadataStatus: ProcessingPhaseStatus = aiError
    ? "failed"
    : "completed";
  const finalOverallStatus: OverallStatus =
    finalMetadataStatus === "failed"
      ? "failed"
      : fullReport.overallStatus === "completed"
        ? "completed"
        : "partial";

  const updateData: Partial<IReport> = {
    metadataStatus: finalMetadataStatus,
    overallStatus: finalOverallStatus,
    metadataError: aiError,
    ...(!aiError && extractedObject
      ? {
          title: extractedObject.title ?? fullReport.title,
          patientName: extractedObject.patientName ?? fullReport.patientName,
          patientSex: extractedObject.patientSex ?? fullReport.patientSex,
          patientAge: extractedObject.patientAge ?? fullReport.patientAge,
          labName: extractedObject.labName ?? fullReport.labName,
          referringDoctor:
            extractedObject.referringDoctor ?? fullReport.referringDoctor,
          sampleDate: extractedObject.sampleDate ?? fullReport.sampleDate,
          reportDate: extractedObject.reportDate ?? fullReport.reportDate,
          labDirector: extractedObject.labDirector ?? fullReport.labDirector,
          labContact: extractedObject.labContact ?? fullReport.labContact,
        }
      : {}),
  };

  try {
    // Update DB, select only required fields, and return the limited object
    const updatedLimitedReport = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    )
    .select(selectionString)
    .lean<LimitedReportMetadata>();

    if (!updatedLimitedReport) {
      console.error(
        `Failed to update or find report ${reportId} after processing.`
      );
      return null;
    }

    console.log(
      `Finished metadata processing for report ${reportId}. Final status: ${updatedLimitedReport.metadataStatus}`
    );
    return updatedLimitedReport;
  } catch (dbError) {
    console.error(
      `Database error updating report ${reportId} after metadata processing:`,
      dbError
    );
    return null; // Indicates update failure
  }
};
