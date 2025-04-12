import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto"; // For generating unique identifiers

// Ensure required environment variables are defined
if (!process.env.X_AWS_REGION || !process.env.X_AWS_ACCESS_KEY_ID || !process.env.X_AWS_SECRET_ACCESS_KEY || !process.env.X_AWS_BUCKET_NAME) {
  throw new Error("Missing required AWS S3 environment variables (Region, Key ID, Secret Key, Bucket Name)");
}

const s3Client = new S3Client({
  region: process.env.X_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.X_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.X_AWS_SECRET_ACCESS_KEY!,
  },
});

export const POST = async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Connect to MongoDB (optional, might be used for checks later)
    // await connect();

    const { fileType, fileName, fileSize } = await request.json();

    // Basic validation
    if (!fileType || typeof fileType !== 'string' || !fileName || typeof fileName !== 'string' || !fileSize || typeof fileSize !== 'number') {
      return NextResponse.json(
        { error: "Missing or invalid fileType, fileName, or fileSize" },
        { status: 400 }
      );
    }

    // Add size validation based on type (align with frontend)
    const PDF_MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
    let maxSize: number | null = null;

    if (fileType === 'application/pdf') {
        maxSize = PDF_MAX_SIZE;
    } else if (fileType.startsWith('image/')) {
        maxSize = IMAGE_MAX_SIZE;
    }

    if (maxSize !== null && fileSize > maxSize) {
        return NextResponse.json(
            { error: `File size exceeds limit (${(maxSize / 1024 / 1024).toFixed(1)}MB) for type ${fileType}` },
            { status: 413 } // 413 Payload Too Large
        );
    }

    // Generate a unique key for S3
    // Example: userId/reports/uniqueId-originalFileName.pdf
    const uniqueId = randomUUID();
    // Sanitize filename to prevent issues with S3 keys
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const key = `${userId}/reports/${uniqueId}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.X_AWS_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize, // Recommended for presigned PUT URLs
      Metadata: {
        "user-id": userId,
        "original-filename": fileName, // Store original filename in metadata
      },
    });

    // Generate the signed URL (expires in 60 seconds by default)
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({
      success: true,
      message: "Signed URL generated successfully",
      url: url,
      filePath: key, // Return the key so the client knows where the file will be stored
      method: "PUT", // Inform client to use PUT method
    });

  } catch (error) {
    console.error("Error generating signed URL:", error);
    // Handle specific errors if needed, otherwise generic error
    return NextResponse.json(
      { error: "Internal server error generating upload URL" },
      { status: 500 }
    );
  }
  // finally {
  // Disconnect only if you are sure no other operations are pending
  // await disconnect();
  // }
}; 