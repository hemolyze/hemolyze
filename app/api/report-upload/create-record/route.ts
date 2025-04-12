import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import Report, { IReportFile } from "@/lib/models/Report"; // Import the Report model and IReportFile type

// Interface for the expected request body
interface CreateReportRequestBody {
  uploadedFiles: {
    fileName: string;
    filePath: string; // This is the S3 key
    fileType: string;
    fileSize: number;
  }[];
}

export const POST = async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreateReportRequestBody = await request.json();
    const { uploadedFiles } = body;

    // Validate input
    if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid uploadedFiles data" },
        { status: 400 }
      );
    }

    // Further validation on each file object (optional, but recommended)
    const isValidFiles = uploadedFiles.every(
      (file) =>
        file &&
        typeof file.fileName === 'string' &&
        typeof file.filePath === 'string' &&
        typeof file.fileType === 'string' &&
        typeof file.fileSize === 'number'
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

    // Create the report document with dummy data
    const newReport = await Report.create({
      userId: userId,
      files: reportFiles,
      processingStatus: 'pending', // Initial status
      // --- Dummy Data --- (Replace later with actual extracted data)
      patientName: "Jane Doe (Dummy)",
      patientSex: "Female",
      patientAge: "30 years",
      labName: "General Hospital Lab (Dummy)",
      referringDoctor: "Dr. Smith (Dummy)",
      reportDate: new Date(),
      // sampleDate: new Date(), // Optional dummy data
      // labDirector: "Lab Director Name (Dummy)",
      // labContact: "123-456-7890 (Dummy)",
      bloodTests: {}, // Starts empty
      // --- End Dummy Data ---
    });

    return NextResponse.json({
      success: true,
      message: "Report record created successfully",
      reportId: newReport._id,
      report: newReport, // Optionally return the full report object
    });

  } catch (error) {
    console.error("Error creating report record:", error);
    let errorMessage = "Internal server error creating report record";
    if (error instanceof Error) {
        // Handle potential Mongoose validation errors specifically if needed
        errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}; 