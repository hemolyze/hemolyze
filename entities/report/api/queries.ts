import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import Report, { IReport } from "@/lib/models/Report";
import { connect } from "@/lib/db";

interface SidebarReportItem {
  id: string;
  name: string;
  url: string;
  status: IReport["overallStatus"];
}

/**
 * Fetches reports for the current authenticated user, formatted for sidebar display.
 * Selects only the necessary fields (_id, title, processingStatus) for performance.
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
      .select("_id title processingStatus")
      .sort({ createdAt: -1 }) // Show newest reports first
      .lean<
        Pick<
          IReport & { _id: mongoose.Types.ObjectId },
          "_id" | "title" | "overallStatus"
        >[]
      >();

    // console.log(`getReportsForSidebar (in entities): Found ${reports.length} reports for user ${userId}.`);
    // @ts-expect-error - Improve types
    const formattedReports: SidebarReportItem[] = reports.map((report) => {
      const displayName = report.title || `Report ${report._id.toString()}`;
      return {
        id: report._id,
        name: displayName,
        url: `/reports/${report._id.toString()}`,
        status: report.overallStatus,
      };
    });

    // console.log("getReportsForSidebar (in entities): Successfully formatted reports.");
    return formattedReports;
  } catch (error) {
    console.error("Error fetching reports for sidebar (in entities):", error);
    return [];
  } finally {
    // console.log("getReportsForSidebar (in entities): Disconnected from DB.");
  }
}
