import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import Report, { IReportFile } from "@/lib/models/Report"; // Import the Report model and IReportFile type
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"; // AWS SDK S3 Client
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // AWS SDK S3 Presigner

// Interface for the expected request body
interface CreateReportRequestBody {
  uploadedFiles: {
    fileName: string;
    filePath: string; // This is the S3 key
    fileType: string;
    fileSize: number;
  }[];
}

// Interface for the file object including the signed URL
interface ReportFileWithUrl extends IReportFile {
  signedUrl: string;
}

// Initialize S3 Client - reads credentials and region from environment variables
// Ensure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION are set
const s3Client = new S3Client({
  region: process.env.X_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.X_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.X_AWS_SECRET_ACCESS_KEY!,
  },
});
const S3_BUCKET_NAME = process.env.X_AWS_BUCKET_NAME;

export const POST = async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if S3 bucket name is configured
  if (!S3_BUCKET_NAME) {
    console.error("S3_BUCKET_NAME environment variable is not set.");
    return NextResponse.json(
      { error: "Server configuration error: Missing S3 bucket name." },
      { status: 500 }
    );
  }

  try {
    const body: CreateReportRequestBody = await request.json();
    const { uploadedFiles } = body;

    // Validate input
    if (
      !uploadedFiles ||
      !Array.isArray(uploadedFiles) ||
      uploadedFiles.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid uploadedFiles data" },
        { status: 400 }
      );
    }

    // Further validation on each file object (optional, but recommended)
    const isValidFiles = uploadedFiles.every(
      (file) =>
        file &&
        typeof file.fileName === "string" &&
        typeof file.filePath === "string" &&
        typeof file.fileType === "string" &&
        typeof file.fileSize === "number"
    );

    if (!isValidFiles) {
      return NextResponse.json(
        { error: "Invalid data format within uploadedFiles array" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connect();

    // Prepare the files array for the Report model
    const reportFiles: IReportFile[] = uploadedFiles.map((file) => ({
      fileName: file.fileName,
      filePath: file.filePath,
      fileType: file.fileType,
      fileSize: file.fileSize,
    }));

    // Create the report document
    const newReport = await Report.create({
      userId: userId,
      files: reportFiles,
      processingStatus: "pending", // Initial status
      // Dummy data (Replace as needed)
      patientName: "Jane Doe (Dummy)",
      patientSex: "Female",
      patientAge: "30 years",
      labName: "General Hospital Lab (Dummy)",
      referringDoctor: "Dr. Smith (Dummy)",
      reportDate: new Date(),
      bloodTests: {},
    });

    // Generate pre-signed URLs for the uploaded files (runtime only)
    const filesWithUrls: ReportFileWithUrl[] = await Promise.all(
      newReport.files.map(async (file: IReportFile) => {
        const command = new GetObjectCommand({
          Bucket: S3_BUCKET_NAME!,
          Key: file.filePath, // Use filePath as the S3 Key
        });
        // Generate a temporary URL valid for 1 hour
        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });
        // Manually construct the object using properties from IReportFile
        return {
          fileName: file.fileName,
          filePath: file.filePath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          // Add other IReportFile properties if they exist (e.g., _id if needed, but it's usually not in the interface itself)
          signedUrl: signedUrl,
        };
      })
    );

    // Prepare the response report object with files containing signed URLs
    // This does NOT update the database record
    const responseReport = {
      ...newReport.toObject(), // Convert Mongoose doc to plain object
      files: filesWithUrls, // Replace original files array with the one containing URLs
    };

    return NextResponse.json({
      success: true,
      message: "Report record created successfully with signed URLs",
      reportId: newReport._id,
      report: responseReport, // Return the report object with runtime signed URLs
    });
  } catch (error) {
    console.error(
      "Error creating report record or generating signed URLs:",
      error
    );
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      // Handle potential Mongoose validation errors specifically if needed
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
