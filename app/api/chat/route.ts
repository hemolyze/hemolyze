import { streamText, type Message } from "ai";
import { BloodTestsData, TestResult } from "@/lib/models/Report"; // Import types
import { getAiModel } from "@/shared/lib/ai/gemini";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const aiModel = getAiModel();

// Define the structure for the richer report context
interface ReportChatContext {
  metadata: {
    patientName?: string | null;
    patientAge?: string | null;
    patientSex?: string | null;
    referringDoctor?: string | null;
    labName?: string | null;
    sampleDate?: string | null;
    reportDate?: string | null;
    labDirector?: string | null;
    labContact?: string | null;
  };
  testsData?: BloodTestsData | null;
}

// Define the expected structure of the request body
interface ChatRequestBody {
  messages: Message[];
  reportContext?: ReportChatContext | null;
}

// Helper function to summarize test results for the prompt
function summarizeTestsData(testsData: BloodTestsData): string {
  let summary = "";

  if (testsData.gauge && testsData.gauge.length > 0) {
    summary += "\nKey Gauge Results:";
    testsData.gauge.forEach((test: TestResult) => {
      summary += `\n- ${test.test}: ${test.result}${
        test.unit ? " " + test.unit : ""
      }${test.interpretation ? ` (${test.interpretation})` : ""}`;
    });
  }

  if (testsData.table && testsData.table.length > 0) {
    summary += "\n\nGrouped Table Results:";
    testsData.table.forEach((group) => {
      summary += `\n- ${group.group}:`;
      group.tests.forEach((test: TestResult) => {
        summary += `\n  - ${test.test}: ${test.result}${
          test.unit ? " " + test.unit : ""
        }${test.interpretation ? ` (${test.interpretation})` : ""}`;
      });
    });
  }

  return summary.trim() ? `\n\nAvailable Test Results Summary:${summary}` : "";
}

export async function POST(req: Request) {
  const { messages, reportContext }: ChatRequestBody = await req.json();

  // Updated system prompt with stricter scope definition
  let systemPrompt =
    "You are Hemolyze AI, a specialized assistant focused *exclusively* on explaining the provided medical blood test report data to the patient. \
Your goal is to help the user understand their results in a clear, concise, and empathetic manner. \
**Strictly limit your responses to the information contained within the report context (metadata and test results) and general medical knowledge directly relevant to interpreting these specific tests.** \
Do not provide medical diagnoses, treatment plans, or prognoses. Always recommend consulting a healthcare professional for such matters. \
**If asked a question outside the scope of this report or general medical test interpretation (e.g., current events, history, unrelated science, personal opinions), politely refuse to answer, stating that you are specialized in explaining this medical report only.**";

  // Add metadata context
  if (reportContext?.metadata) {
    const meta = reportContext.metadata;
    const contextParts = [];
    if (meta.patientName)
      contextParts.push(`patient's name is ${meta.patientName}`);
    if (meta.patientAge) contextParts.push(`age ${meta.patientAge}`);
    if (meta.patientSex) contextParts.push(`sex ${meta.patientSex}`);
    if (meta.referringDoctor)
      contextParts.push(`referring doctor ${meta.referringDoctor}`);
    if (meta.labName) contextParts.push(`lab ${meta.labName}`);
    if (meta.reportDate) contextParts.push(`report date ${meta.reportDate}`);
    // Add others as needed: sampleDate, labDirector, labContact

    if (contextParts.length > 0) {
      systemPrompt += `\n\nThe current report context is for a patient identified as: ${contextParts.join(
        ", "
      )}.`;
    }
  }

  // Add summarized test results context
  if (reportContext?.testsData) {
    const testsSummary = summarizeTestsData(reportContext.testsData);
    if (testsSummary) {
      systemPrompt += testsSummary;
    }
  }

  const result = await streamText({
    model: aiModel,
    messages,
    system: systemPrompt,
  });

  return result.toDataStreamResponse();
}
