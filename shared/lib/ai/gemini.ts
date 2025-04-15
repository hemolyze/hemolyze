import { LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

let aiModelInstance: LanguageModel | null = null;

/**
 * Initializes and returns a singleton Gemini language model instance.
 * Reads the API key from environment variables.
 * @throws Error if the GOOGLE_GENERATIVE_AI_API_KEY environment variable is missing.
 */
export function getAiModel(): LanguageModel {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable.");
  }

  if (!aiModelInstance) {
    // Create a configured Google AI provider instance
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
    });

    // Initialize Gemini model with appropriate settings
    aiModelInstance = google("gemini-2.0-flash-001", {
      // Disable structured outputs due to OpenAPI schema limitations with Gemini
      structuredOutputs: false,
      // Configure safety settings to allow necessary content while blocking harmful content
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    });
    console.log("Gemini AI Model Initialized with safety settings.");
  }
  return aiModelInstance;
} 