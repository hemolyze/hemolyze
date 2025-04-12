import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db";
import Report, { IReportFile } from "@/lib/models/Report";

// --- API Route Handler ---

export const POST = async (request: NextRequest) => {
    try {
        // 1. Authentication & Authorization
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse and Validate Input
        const body: { uploadedFiles: { fileName: string; filePath: string; fileType: string; fileSize: number }[] } = await request.json();
        const { uploadedFiles } = body;
        if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
            return NextResponse.json({ error: "Missing or invalid uploadedFiles data" }, { status: 400 });
        }
        // Add more specific validation per file if needed

        // 3. Database Connection
        await connect();

        // 4. Prepare Basic File Data for DB
        const reportFiles: IReportFile[] = uploadedFiles.map((file) => ({
            fileName: file.fileName,
            filePath: file.filePath, // S3 key
            fileType: file.fileType,
            fileSize: file.fileSize,
        }));

        // 5. Create Report Record in DB with Pending Status and Defaults
        const newReport = await Report.create({
            userId: userId,
            files: reportFiles, // Store original file info (paths, names)
            processingStatus: "pending", // Set initial status to pending
            // Use default/empty values for metadata - AI will populate later
            title: "Untitled Report", // Default title
            patientName: "",
            patientSex: "",
            patientAge: "",
            labName: "",
            referringDoctor: "",
            sampleDate: "",
            reportDate: "",
            labDirector: "",
            labContact: "",
            bloodTests: {}, // Starts empty
            errorMessage: undefined, // Clear any previous error message
        });

        // 6. Prepare and Return Immediate Response
        return NextResponse.json({
            success: true,
            message: `Report record created successfully with ID: ${newReport._id}. Processing has been queued.`,
            reportId: newReport._id, // Only return the ID
        });

    } catch (error) {
        console.error("Error creating initial report record:", error);
        // Basic error handling for DB creation failure
        let errorMessage = "Failed to create report record.";
        if (error instanceof Error) {
            errorMessage = error.message; // Provide more specific error if available
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
};
