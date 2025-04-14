import { ReportFileWithUrl } from "./generateSignedUrls"; // Assuming it's in the same directory

export interface FetchedFileData {
  fileName: string;
  fileType: string;
  fileBuffer: Buffer;
  signedUrl?: string; // Add optional signedUrl for images
  error?: string;
}

/**
 * Fetches the content of files from their signed S3 URLs.
 * @param filesWithUrls - Array of file objects including their signedUrl.
 * @returns Promise resolving to an array of objects containing file info and content buffer or an error message.
 */
export async function fetchFileContentsForProcessing(
  filesWithUrls: ReportFileWithUrl[]
): Promise<FetchedFileData[]> {
  return Promise.all(
    filesWithUrls.map(async (file) => {
      // Skip fetching if the signed URL generation failed or wasn't provided
      if (!file.signedUrl) {
        console.warn(`Skipping fetch for ${file.fileName} due to missing signed URL.`);
        return {
          fileName: file.fileName,
          fileType: file.fileType,
          fileBuffer: Buffer.alloc(0), // Keep buffer empty
          error: "Missing signed URL",
        };
      }

      // Check if it's an image type
      if (file.fileType.startsWith("image/")) {
        console.log(`Detected image type for ${file.fileName}, using signed URL.`);
        return {
          fileName: file.fileName,
          fileType: file.fileType,
          fileBuffer: Buffer.alloc(0), // Keep buffer empty for images
          signedUrl: file.signedUrl,   // Store the signed URL
        };
      }

      // Existing logic for non-image files (like PDFs)
      try {
        const response = await fetch(file.signedUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${file.fileName} from S3: ${response.statusText} (Status: ${response.status})`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        return {
          fileName: file.fileName,
          fileType: file.fileType,
          fileBuffer: Buffer.from(arrayBuffer),
          // No signedUrl needed here as we have the buffer
        };
      } catch (err) {
        console.error(`Error fetching file ${file.fileName} from ${file.signedUrl}:`, err);
        return {
          fileName: file.fileName,
          fileType: file.fileType,
          fileBuffer: Buffer.alloc(0), // Keep buffer empty on error
          error: err instanceof Error ? err.message : "Unknown fetch error",
        };
      }
    })
  );
} 