import { S3Client } from "@aws-sdk/client-s3";

let s3ClientInstance: S3Client | null = null;

/**
 * Initializes and returns a singleton S3 client instance.
 * Reads AWS credentials and region from environment variables.
 * @throws Error if required AWS environment variables are missing.
 */
export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    if (
      !process.env.X_AWS_REGION ||
      !process.env.X_AWS_ACCESS_KEY_ID ||
      !process.env.X_AWS_SECRET_ACCESS_KEY
    ) {
      throw new Error(
        "Missing required AWS environment variables for S3 client."
      );
    }
    s3ClientInstance = new S3Client({
      region: process.env.X_AWS_REGION!,
      credentials: {
        accessKeyId: process.env.X_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.X_AWS_SECRET_ACCESS_KEY!,
      },
    });
    console.log("AWS S3 Client Initialized."); // Add log for debugging
  }
  return s3ClientInstance;
} 