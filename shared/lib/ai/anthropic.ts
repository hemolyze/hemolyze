import { LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

let aiModelInstance: LanguageModel | null = null;

/**
 * Initializes and returns a singleton Anthropic language model instance.
 * Reads the API key from environment variables.
 * @throws Error if the ANTHROPIC_API_KEY environment variable is missing.
 */
export function getAiModel(): LanguageModel {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }
  if (!aiModelInstance) {
    // Initialize the specific model you want to use
    aiModelInstance = anthropic("claude-3-5-sonnet-latest");
     console.log("Anthropic AI Model Initialized."); // Add log for debugging
  }
  return aiModelInstance;
} 