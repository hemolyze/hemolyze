"use server";

import { connect } from "@/lib/db";
import Report, {
  BloodTestsData,
  IReport,
  TestResult,
} from "@/lib/models/Report";
import { getAiModel } from "@/shared/lib/ai/anthropic";
import { generateObject } from "ai";
import { Types } from "mongoose";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// --- Zod Schema for Educational Info (Copied back) ---
const BloodTestEducationalInfoSchema = z.object({
  testName: z
    .string()
    .describe(
      "The common name of the blood test (e.g., 'Folate', 'Hemoglobin A1c')."
    ),
  whatItIs: z
    .object({
      definition: z
        .string()
        .describe(
          "A simple explanation of what the substance/marker being tested is."
        ),
      purpose: z
        .string()
        .describe(
          "Why this test is commonly performed and what it helps monitor or diagnose in simple terms."
        ),
      bodySystem: z
        .string()
        .optional()
        .describe(
          "Optional: The primary body system or function related to this test (e.g., 'Blood Cell Production', 'Kidney Function')."
        ),
    })
    .describe(
      "Explains the test's identity, purpose, and related body system."
    ),
  understandingResults: z
    .object({
      normalRangeExplanation: z
        .string()
        .describe(
          "An easy-to-understand explanation of what a 'normal' reference range means, including units, and mentioning potential lab variations."
        ),
      unitsExplained: z
        .string()
        .optional()
        .describe(
          "Optional: A simple breakdown of what the measurement unit (e.g., 'ng/mL', 'g/dL') means, if helpful."
        ),
    })
    .describe("Helps users understand reference ranges and units."),
  abnormalResults: z
    .object({
      low: z
        .object({
          title: z
            .string()
            .default("What Lower Than Normal Might Mean")
            .describe("Section title for low results."),
          potentialCauses: z
            .string()
            .describe(
              "Common potential reasons why a result might be lower than normal. Uses cautious, non-diagnostic language."
            ),
          potentialImplications: z
            .string()
            .describe(
              "Simple explanation of what low levels might mean for health or daily life, avoiding alarmist language."
            ),
        })
        .optional()
        .describe(
          "Information about results potentially below the normal range."
        ),
      high: z
        .object({
          title: z
            .string()
            .default("What Higher Than Normal Might Mean")
            .describe("Section title for high results."),
          potentialCauses: z
            .string()
            .describe(
              "Common potential reasons why a result might be higher than normal. Uses cautious, non-diagnostic language."
            ),
          potentialImplications: z
            .string()
            .describe(
              "Simple explanation of what high levels might mean for health or daily life, avoiding alarmist language."
            ),
        })
        .optional()
        .describe(
          "Information about results potentially above the normal range."
        ),
      generalDisclaimer: z
        .string()
        .describe(
          "A reminder that these are general possibilities and not a diagnosis; interpretation requires a healthcare provider."
        ),
    })
    .describe("Explains potential implications of high or low results."),
  symptomsAndActions: z
    .object({
      associatedSymptoms: z
        .string()
        .optional()
        .describe(
          "Optional: Lists common symptoms *potentially* linked to *significant* deviations. Must include strong caveats about non-specificity and the possibility of having no symptoms."
        ),
      whenToSeekHelp: z
        .string()
        .describe(
          "Clear guidance emphasizing consultation with a healthcare provider for any abnormal results, concerns, or symptoms. This is a crucial directive."
        ),
    })
    .describe(
      "Covers potential symptoms and provides clear guidance on seeking medical advice."
    ),
  lifestyleTips: z
    .object({
      title: z
        .string()
        .default("Lifestyle and Wellness Tips")
        .describe("Section title for lifestyle tips."),
      generalTips: z
        .string()
        .describe(
          "Actionable advice on diet, exercise, or habits that may support healthy levels or overall wellness related to this test. Should be general and safe."
        ),
      preventionFocus: z
        .string()
        .optional()
        .describe(
          "Optional: Brief positive framing on how lifestyle choices can contribute to maintaining health relevant to this test."
        ),
      disclaimer: z
        .string()
        .describe(
          "Reminder that these are general tips and do not replace personalized medical or dietary advice."
        ),
    })
    .describe("Offers practical, general wellness advice related to the test."),
  additionalResources: z
    .object({
      glossary: z
        .array(
          z.object({
            term: z.string(),
            definition: z.string(),
          })
        )
        .optional()
        .describe(
          "Optional: Definitions of key medical or technical terms used *within this specific test's explanation*."
        ),
      faq: z
        .array(
          z.object({
            question: z.string(),
            answer: z.string(),
          })
        )
        .optional()
        .describe(
          "Optional: Answers to 1-2 frequently asked questions related to this specific test."
        ),
      finalDisclaimer: z
        .string()
        .describe(
          "Mandatory, prominent disclaimer stating the app provides educational information ONLY, is NOT a substitute for professional medical advice, diagnosis, or treatment, and users MUST consult their healthcare provider."
        ),
    })
    .describe(
      "Provides supplementary information like definitions, FAQs, and the essential final disclaimer."
    ),
});
// --- End Schema Definition ---

// Define types based on TestInfoDialog usage (kept for input parameters)
type PatientDetails = {
  name: string;
  age: number;
  gender: string;
};

type TestDetails = {
  testName: string;
  testId: string;
  result: string;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
  };
};

// Define the expected return type - can be any existing data or an error
type GetTestActionDetailsResult =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { data: any | null; error?: never } | { data?: never; error: string };

/**
 * Retrieves existing or generates new educational information for a specific test within a report.
 *
 * Stores newly generated information back into the report document.
 *
 * @param reportId - The ID of the report.
 * @param testId - The unique ObjectId (_id) of the specific test result object.
 * @param patientDetails - Details about the patient (optional).
 * @param testDetails - Details about the test result (optional).
 * @returns Promise<GetTestActionDetailsResult> - An object containing either the educational data or an error message.
 */
export async function getTestActionDetails(
  reportId: string,
  testId: string, // This is the test result's unique ObjectId (_id)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  patientDetails: PatientDetails | undefined, // Kept for signature consistency, unused here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  testDetails: TestDetails // Kept for signature consistency, unused here
): Promise<GetTestActionDetailsResult> {
  console.log(
    "getTestActionDetails",
    reportId,
    testId,
    patientDetails,
    testDetails
  );

  if (!Types.ObjectId.isValid(reportId)) {
    return { error: "Invalid Report ID format." };
  }
  // Basic check if testId looks like an ObjectId string, though not foolproof
  if (!/^[0-9a-fA-F]{24}$/.test(testId)) {
    return { error: "Invalid Test ID format." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let report:
    | (IReport & import("mongoose").Document<Types.ObjectId, unknown, IReport>)
    | null = null;

  try {
    await connect();

    // Fetch the full Mongoose document, not lean. Let Mongoose infer the type.
    report = await Report.findById(reportId);

    if (!report) {
      return { error: "Report not found." };
    }

    const testsData = report.testsData as BloodTestsData | null | undefined;

    if (!testsData) {
      return { error: "Report has no test data." };
    }

    // Function to find the test *reference* by its _id within the nested structure
    const findTestResultRefById = (
      data: BloodTestsData,
      idToFind: string
    ): TestResult | null => {
      const compareIds = (
        objId: Types.ObjectId | string | { toString(): string },
        idStr: string
      ): boolean => {
        return objId?.toString() === idStr;
      };

      let foundTest: TestResult | null = null;

      // Check gauge tests
      data.gauge?.find((t: TestResult) => {
        if (t._id && compareIds(t._id, idToFind)) {
          foundTest = t;
          return true; // Stop searching
        }
        return false;
      });

      if (foundTest) return foundTest;

      // Check table tests
      data.table?.find((group) => {
        return group.tests?.find((t: TestResult) => {
          if (t._id && compareIds(t._id, idToFind)) {
            foundTest = t;
            return true; // Stop searching inner loop
          }
          return false;
        });
      });

      return foundTest;
    };

    const testResultRef = findTestResultRefById(testsData, testId);

    if (!testResultRef) {
      return { error: `Test with ID '${testId}' not found in this report.` };
    }

    // Check if educational info exists for this test
    if (testResultRef.educationalInfo) {
      console.log(
        `Found existing educational info for test ID '${testId}' in report '${reportId}'.`
      );
      // Return the existing data
      return { data: testResultRef.educationalInfo };
    } else {
      console.log(
        `Educational info not found for test ID '${testId}' in report '${reportId}'. Generating...`
      );
      const aiModel = getAiModel();

      // Generate the educational info structured object
      const { object: generatedInfoObject } = await generateObject({
        model: aiModel,
        schema: BloodTestEducationalInfoSchema, // Use the detailed schema
        prompt: `Generate a JSON object conforming to the BloodTestEducationalInfoSchema for a patient about this test result: ${JSON.stringify(
          testResultRef
        )}.
         Patient details for context (use age/gender if relevant): ${JSON.stringify(
           patientDetails
         )}
         
         Follow these guidelines precisely:
         - Populate 'testName' with the correct test name from the input.
         - Explain what the test is, its purpose, and potentially related body system in 'whatItIs'.
         - Explain the concept of the reference range in 'understandingResults'.
         - If the result is outside the normal range, populate 'abnormalResults.low' or 'abnormalResults.high' accordingly with potential causes/implications (use cautious, non-diagnostic language). Always include 'generalDisclaimer'.
         - Add potential symptoms (optional, with caveats) and clear guidance to see a doctor in 'symptomsAndActions'.
         - Include general lifestyle tips and its disclaimer in 'lifestyleTips'.
         - Include the mandatory 'additionalResources.finalDisclaimer'. Optionally add 1-2 relevant glossary terms or FAQs.
         - Use simple, clear language. Avoid jargon. Ensure all described fields are present.
         - Output ONLY the valid JSON object conforming to the schema.
         `,
      });

      console.log(
        `Generated structured info for test ID '${testId}':`,
        generatedInfoObject
      );

      // Update the found test result reference *within the Mongoose document*
      testResultRef.educationalInfo = generatedInfoObject; // Save the generated object
      report.markModified("testsData"); // Mark the mixed type field as modified

      await report.save(); // Save the entire report document
      console.log(
        `Saved generated info for test ID '${testId}' to report '${reportId}'.`
      );

      // Return the newly generated and saved info
      return { data: generatedInfoObject }; // Return the object
    }
  } catch (error) {
    console.error("Error in getTestActionDetails:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { error: `Operation failed: ${errorMessage}` };
  } finally {
    // Optional: Disconnect if appropriate for your connection strategy
    // await disconnect();
  }
}

// Zod schema for input validation
const DeleteReportSchema = z.object({
  reportId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid report ID",
  }),
});

export interface DeleteReportActionResult {
  success: boolean;
  message: string;
  error?: string | null;
}

/**
 * Deletes a report document.
 * @param reportId The ID of the report to delete.
 * @returns Result object indicating success or failure.
 */
export async function deleteReportAction(
  reportId: string
): Promise<DeleteReportActionResult> {
  const validation = DeleteReportSchema.safeParse({ reportId });
  if (!validation.success) {
    return {
      success: false,
      message: "Validation failed",
      error:
        validation.error.flatten().fieldErrors.reportId?.join(", ") ||
        "Invalid input",
    };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      message: "Unauthorized",
      error: "User not authenticated",
    };
  }

  try {
    await connect();

    const reportToDelete = await Report.findOneAndDelete({
      _id: new Types.ObjectId(validation.data.reportId),
      userId: userId, // Ensure user owns the report
    });

    if (!reportToDelete) {
      return {
        success: false,
        message: "Report not found or user does not have permission.",
        error: "Report not found or unauthorized.",
      };
    }

    // Revalidate relevant paths (adjust path as needed)
    revalidatePath("/new"); // Example path, update to your actual report list page
    // Consider revalidating the specific report page if it exists, though it might redirect anyway
    // revalidatePath(`/dashboard/reports/${reportId}`);

    return { success: true, message: "Report deleted successfully." };
  } catch (error) {
    console.error("Error deleting report:", error);
    return {
      success: false,
      message: "Failed to delete report.",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
  // Note: Disconnect is handled by the db utility or connection pooling usually.
}
