import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IReportFile } from "@/lib/models/Report";
import { getS3Client } from "@/shared/lib/aws/s3";

const S3_BUCKET_NAME = process.env.X_AWS_BUCKET_NAME;

export interface ReportFileWithUrl extends IReportFile {
  signedUrl: string;
}

/**
 * Generates signed S3 URLs for a list of report files.
 * @param files - Array of report file objects.
 * @param expiresIn - URL expiry time in seconds (default: 3600).
 * @returns Promise resolving to an array of files with added signedUrl.
 * @throws Error if S3_BUCKET_NAME environment variable is not set.
 */
export async function generateSignedUrlsForProcessing(
  files: IReportFile[],
  expiresIn: number = 3600
): Promise<ReportFileWithUrl[]> {
  if (!S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set.");
  }
  const s3 = getS3Client(); // Use the shared S3 client

  return Promise.all(
    files.map(async (file) => {
      if (!file.filePath) {
         console.warn(`Skipping file ${file.fileName} due to missing filePath.`);
         // Return the original file structure but mark it as unusable
         // Or handle this case as needed, perhaps throwing an error
         // For now, let's just return it without a URL to avoid breaking Promise.all
         // But downstream logic will need to handle this.
         // A better approach might be to filter out files with no path beforehand.
         return { ...file, signedUrl: "" }; // Indicate failure
      }
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: file.filePath,
      });
      try {
        const signedUrl = await getSignedUrl(s3, command, { expiresIn });
        return {
          ...file,
          signedUrl: signedUrl,
        };
      } catch (error) {
        console.error(`Failed to generate signed URL for ${file.filePath}:`, error);
        return { ...file, signedUrl: "" }; // Indicate failure
      }
    })
  );
} 