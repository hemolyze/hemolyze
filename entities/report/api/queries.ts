import { auth } from "@clerk/nextjs/server";
import mongoose from 'mongoose';
import Report, { IReport } from "@/lib/models/Report";
import { connect } from "@/lib/db";

interface SidebarReportItem {
    name: string;
    url: string;
}

/**
 * Fetches reports for the current authenticated user, formatted for sidebar display.
 * Selects only the necessary fields (_id, files.fileName) for performance.
 * Returns an empty array if the user is not authenticated or an error occurs.
 */
export async function getReportsForSidebar(): Promise<SidebarReportItem[]> {
    const { userId } = await auth();

    if (!userId) {
        console.log("getReportsForSidebar: No user ID found, returning empty array.");
        return []; // Not authenticated
    }

    try {
        await connect();
        console.log("getReportsForSidebar: Connected to DB.");

        // Fetch reports, selecting only necessary fields and using lean
        const reports = await Report.find({ userId })
            .select('_id files.fileName')
            .sort({ createdAt: -1 }) // Show newest reports first
            .lean<Pick<IReport & { _id: mongoose.Types.ObjectId }, '_id' | 'files'>[]>();

        console.log(`getReportsForSidebar: Found ${reports.length} reports for user ${userId}.`);

        const formattedReports: SidebarReportItem[] = reports.map((report) => {
            // Derive name from the first file, fallback to ID
            const reportName = report.files?.[0]?.fileName ?? `Report ${report._id.toString()}`;
            // Remove file extension for cleaner display
            const displayName = reportName.replace(/\.[^/.]+$/, "");
            return {
                name: displayName,
                url: `/reports/${report._id.toString()}`, // Link to the specific report page
            };
        });

        console.log("getReportsForSidebar: Successfully formatted reports.");
        return formattedReports;
    } catch (error) {
        console.error("Error fetching reports for sidebar:", error);
        return []; // Return empty array on error to prevent breaking the UI
    } finally {
        // Ensure disconnection even if errors occur
        // await disconnect();
        console.log("getReportsForSidebar: Disconnected from DB.");
    }
} 