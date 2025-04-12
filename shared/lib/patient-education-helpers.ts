/**
 * Maps patient education keys to human-readable labels.
 */
export const getLabel = (
  value:
    | "testMeaning"
    | "interpretation"
    | "potentialSymptoms"
    | "normalizationTips"
    | "importantNote"
    | string
): string => {
  switch (value) {
    case "testMeaning":
      return "Test Meaning";
    case "interpretation":
      return "Interpretation";
    case "potentialSymptoms":
      return "Potential Symptoms";
    case "normalizationTips":
      return "Normalization Tips";
    case "importantNote":
      return "Important Note";
    default:
      // Return the key itself or an empty string if it's not a known label
      // This handles cases where a string is passed that isn't one of the specific keys
      return typeof value === 'string' && ![ "testMeaning", "interpretation", "potentialSymptoms", "normalizationTips", "importantNote"].includes(value) ? value : "";
  }
}; 