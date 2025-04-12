import { auth } from "@clerk/nextjs/server";
import mongoose from 'mongoose';
import Report, { IReport } from "@/lib/models/Report";
import { connect, disconnect } from "@/lib/db";

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
        // console.log("getReportsForSidebar (in entities): No user ID found, returning empty array.");
        return []; // Not authenticated
    }

    try {
        await connect();
        // console.log("getReportsForSidebar (in entities): Connected to DB.");

        const reports = await Report.find({ userId })
            .select('_id files.fileName')
            .sort({ createdAt: -1 }) // Show newest reports first
            .lean<Pick<IReport & { _id: mongoose.Types.ObjectId }, '_id' | 'files'>[]>();

        // console.log(`getReportsForSidebar (in entities): Found ${reports.length} reports for user ${userId}.`);

        const formattedReports: SidebarReportItem[] = reports.map((report) => {
            const reportName = report.files?.[0]?.fileName ?? `Report ${report._id.toString()}`;
            const displayName = reportName.replace(/\.[^/.]+$/, "");
            return {
                name: displayName,
                url: `/reports/${report._id.toString()}`,
            };
        });

        // console.log("getReportsForSidebar (in entities): Successfully formatted reports.");
        return formattedReports;
    } catch (error) {
        console.error("Error fetching reports for sidebar (in entities):", error);
        return [];
    } finally {
        await disconnect();
        // console.log("getReportsForSidebar (in entities): Disconnected from DB.");
    }
} 